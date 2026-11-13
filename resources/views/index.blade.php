<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexora</title>
    <meta name="description" content="Nexora: transforme seus materiais de aula em resumos, flashcards e questões, e saiba o que revisar primeiro.">
    <meta name="theme-color" content="#f6f6f3">
    <link rel="icon" href="{{ asset('img/favicon.ico') }}?v={{ config('app.version') }}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>

<body>
    <div id="root"></div>
</body>

</html>
