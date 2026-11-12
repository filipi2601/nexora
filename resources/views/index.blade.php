<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>App</title>
    <meta name="description" content="App">
    <link rel="icon" href="{{ asset('img/favicon.ico') }}?v={{ config('app.version') }}" />
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>

<body>
    <div id="root"></div>
</body>

</html>
