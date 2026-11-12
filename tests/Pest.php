<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Monta um arquivo do Office mínimo e devolve o caminho: um ZIP com os XML na ordem em que
 * o Office os grava ([Content_Types].xml primeiro), para o tipo também ser reconhecido pelo conteúdo.
 *
 * @param  array<string, string>  $parts  caminho dentro do ZIP => XML
 */
function makeOfficeFile(array $parts): string
{
    $path = tempnam(sys_get_temp_dir(), 'office');
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
    $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');

    foreach ($parts as $name => $xml) {
        $zip->addFromString($name, $xml);
    }

    $zip->close();

    return $path;
}

/**
 * Um .docx com um parágrafo por item. Um item pode ser uma lista de trechos (runs), como o
 * Word grava uma palavra que mudou de formatação no meio.
 *
 * @param  list<string|list<string>>  $paragraphs
 */
function makeDocx(array $paragraphs): string
{
    $body = '';

    foreach ($paragraphs as $paragraph) {
        $runs = '';

        foreach ((array) $paragraph as $run) {
            $runs .= '<w:r><w:t xml:space="preserve">'.htmlspecialchars($run, ENT_XML1).'</w:t></w:r>';
        }

        $body .= "<w:p>{$runs}</w:p>";
    }

    return makeOfficeFile([
        'word/document.xml' => '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'.$body.'</w:body></w:document>',
    ]);
}

/**
 * Um .pptx com os slides dados pelo número do arquivo (slide1.xml, slide2.xml...), um parágrafo por item.
 *
 * @param  array<int, list<string>>  $slides
 */
function makePptx(array $slides): string
{
    $parts = [];

    foreach ($slides as $number => $paragraphs) {
        $body = '';

        foreach ($paragraphs as $paragraph) {
            $body .= '<a:p><a:r><a:t>'.htmlspecialchars($paragraph, ENT_XML1).'</a:t></a:r></a:p>';
        }

        $parts["ppt/slides/slide{$number}.xml"] = '<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody>'.$body.'</p:txBody></p:sp></p:spTree></p:cSld></p:sld>';
    }

    return makeOfficeFile($parts);
}
