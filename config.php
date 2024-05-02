<?php

$dbHost = 'localhost';
$dbUsername = 'root';
$dbPassword = '';
$dbName = 'site_de_busca';

$conexao = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);

//if ($conexao->connect_error)
//{
//    echo "Erro";
//}
//else
//{
//    echo "Conexão efetuada com sucesso";
//}
?>