<?php
    session_start();

    //print_r($_REQUEST);
    if(isset($_POST['submit']) && !empty($_POST['usuario']) && !empty($_POST['senha']))
    {
        //Acessa
        include_once('config.php');
        $usuario = $_POST['usuario'];
        $senha = $_POST['senha'];

        //print_r('Usuario: ' . $usuario);
        //print_r('br');
        //print_r('Senha: ' . $senha);

        $sql = "SELECT * FROM usuarios where id = '$usuario' and senha = '$senha'";

        $result = $conexao->query($sql);

        //print_r($sql);
        //print_r($result);

        if(mysqli_num_rows($result) < 1)
        {
            unset($_SESSION['id']);
            unset($_SESSION['senha']);
            header('Location: login.php');
        }
        else
        {
            $_SESSION['id'] = $usuario;
            $_SESSION['senha'] = $senha;
            header('Location: SiteDeBusca.php');
        }
    }
    else
    {
        //Não acessa
        header('Location: login.php');
    }

?>