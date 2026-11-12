<?php

namespace App\Services;

use App\Models\User;
use DOMDocument;
use Laravel\Ai\Files\LocalDocument;
use Smalot\PdfParser\Parser as PdfParser;
use ZipArchive;

use function Laravel\Ai\agent;

class FileService
{
    public function __construct(private AiProviderService $aiProviderService) {}

    protected const PDF = 'application/pdf';

    protected const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    protected const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    /**
     * Os namespaces do XML do Office: no Word, parágrafos são w:p e trechos de texto w:t;
     * nos slides, a:p e a:t.
     */
    protected const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    protected const SLIDE_NAMESPACE = 'http://schemas.openxmlformats.org/drawingml/2006/main';

    /**
     * Teto de um XML descompactado, para um arquivo de 10 MB não virar gigabytes na memória.
     */
    protected const MAX_XML_BYTES = 50 * 1024 * 1024;

    /**
     * Abaixo disso, o texto não serve para gerar tópicos e questões.
     */
    protected const MIN_TEXT_LENGTH = 50;

    /**
     * Quanto a IA pode levar para transcrever um PDF escaneado, em segundos. O padrão do
     * cliente HTTP (30 s) é pouco para um documento de várias páginas.
     */
    protected const OCR_TIMEOUT = 180;

    /**
     * O texto do arquivo. Com $user, um PDF escaneado é lido pela IA que ele escolheu para o OCR.
     */
    public function extractTextFromFile(string $filePath, string $mimeType, ?User $user = null): string
    {
        $text = match ($mimeType) {
            self::PDF => $this->extractFromPdf($filePath, $user),
            self::DOCX => $this->extractFromDocx($filePath),
            self::PPTX => $this->extractFromPptx($filePath),
            default => throw new \InvalidArgumentException("Tipo de arquivo não suportado: {$mimeType}"),
        };

        if (! $this->hasEnoughText($text)) {
            throw new \RuntimeException('Texto extraído vazio ou insuficiente: o arquivo pode ter só imagens, como um PDF escaneado.');
        }

        return $text;
    }

    public function generateSummary(string $text, ?User $user = null): string
    {
        $options = $this->aiProviderService->promptOptions($user);

        $response = agent(
            instructions: <<<'PROMPT'
                Você é um especialista em resumo e análise de documentos.

                Sua tarefa é resumir o conteúdo fornecido pelo usuário.

                Regras:
                - Responda sempre em português do Brasil.
                - Seja objetivo e claro.
                - Identifique os principais pontos do documento.
                - Preserve informações importantes como nomes, datas, valores e números.
                - Não invente informações que não estejam no documento.
                - Ignore informações repetitivas ou irrelevantes.
                - Produza um resumo que permita entender o conteúdo sem ler o documento inteiro.
            PROMPT,
        )->prompt(
            <<<PROMPT
                Faça um resumo do seguinte documento:

                {$text}
            PROMPT,
            provider: $options['provider'],
            model: $options['model'],
        );

        return $response->text;
    }

    /**
     * O texto de um PDF. Um PDF escaneado (só imagens) não tem texto; nesse caso, o provedor
     * ativo do aluno lê as páginas e transcreve o texto (OCR), se ele ler PDF e tiver chave.
     * Não trocamos por outro provedor sem o aluno saber.
     */
    protected function extractFromPdf(string $filePath, ?User $user = null): string
    {
        $text = (new PdfParser)->parseFile($filePath)->getText();

        if ($this->hasEnoughText($text) || !$this->aiProviderService->isAvailable($user)) {
            return $text;
        }

        return $this->transcribeScannedPdf($filePath, $user);
    }

    /**
     * OCR: o próprio PDF vai para a IA, que o lê como imagens. Só a OpenAI e o Gemini aceitam
     * PDF; a chave é a do aluno, se ele salvou uma, ou a do app.
     */
    protected function transcribeScannedPdf(string $filePath, ?User $user = null): string
    {
        $options = $this->aiProviderService->promptOptions($user);

        $response = agent(
            instructions: <<<'PROMPT'
                Você transcreve documentos escaneados (OCR).

                Regras:
                - Transcreva todo o texto do documento, página por página, na ordem de leitura.
                - Mantenha o idioma original: não traduza, não resuma e não comente.
                - Ignore o que se repete em todas as páginas, como cabeçalhos, rodapés e números de página.
                - Se não houver texto legível, responda com uma linha vazia.
            PROMPT,
        )->prompt(
            'Transcreva o texto deste documento.',
            attachments: [new LocalDocument($filePath, self::PDF)],
            provider: $options['provider'],
            model: $options['model'],
            timeout: self::OCR_TIMEOUT,
        );

        return $response->text;
    }

    protected function hasEnoughText(string $text): bool
    {
        return mb_strlen(trim($text)) >= self::MIN_TEXT_LENGTH;
    }

    /**
     * Um .docx é um ZIP; o texto fica em word/document.xml, e cada parágrafo vira uma linha.
     */
    protected function extractFromDocx(string $filePath): string
    {
        $zip = $this->openOfficeFile($filePath);

        try {
            return implode("\n", $this->paragraphs($this->readPart($zip, 'word/document.xml'), self::WORD_NAMESPACE));
        } finally {
            $zip->close();
        }
    }

    /**
     * Um .pptx é um ZIP com um XML por slide (ppt/slides/slide1.xml, slide2.xml...). Os slides
     * vão na ordem do número, separados por uma linha em branco; slides só com imagem ficam de fora.
     */
    protected function extractFromPptx(string $filePath): string
    {
        $zip = $this->openOfficeFile($filePath);

        try {
            $slides = [];

            for ($index = 0; $index < $zip->numFiles; $index++) {
                if (preg_match('#^ppt/slides/slide(\d+)\.xml$#', $zip->getNameIndex($index), $match)) {
                    $slides[(int) $match[1]] = implode("\n", $this->paragraphs($this->readPart($zip, $match[0]), self::SLIDE_NAMESPACE));
                }
            }

            ksort($slides);

            return implode("\n\n", array_filter($slides, fn(string $slide): bool => $slide !== ''));
        } finally {
            $zip->close();
        }
    }

    protected function openOfficeFile(string $filePath): ZipArchive
    {
        $zip = new ZipArchive;

        if ($zip->open($filePath, ZipArchive::RDONLY) !== true) {
            throw new \RuntimeException('Não foi possível abrir o arquivo: ele parece estar corrompido.');
        }

        return $zip;
    }

    protected function readPart(ZipArchive $zip, string $name): string
    {
        $size = $zip->statName($name)['size'] ?? null;

        if ($size === null || $size > self::MAX_XML_BYTES) {
            throw new \RuntimeException("Não foi possível ler {$name}: o arquivo parece estar corrompido.");
        }

        return $zip->getFromName($name);
    }

    /**
     * Os parágrafos (p) de um XML do Office, cada um com o texto dos seus trechos (t) juntos.
     *
     * Só os elementos t trazem o texto visível: texto apagado numa revisão e códigos de campo
     * ficam de fora.
     *
     * @return list<string>
     */
    protected function paragraphs(string $xml, string $namespace): array
    {
        $document = new DOMDocument;

        if (! $document->loadXML($xml, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING)) {
            throw new \RuntimeException('Não foi possível ler o conteúdo do arquivo: ele parece estar corrompido.');
        }

        $paragraphs = [];

        foreach ($document->getElementsByTagNameNS($namespace, 'p') as $paragraph) {
            $text = '';

            foreach ($paragraph->getElementsByTagNameNS($namespace, 't') as $run) {
                $text .= $run->textContent;
            }

            if (trim($text) !== '') {
                $paragraphs[] = $text;
            }
        }

        return $paragraphs;
    }
}
