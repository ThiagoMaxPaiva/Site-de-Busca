<?php

session_start();
include 'config.php'; //

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Obtenha os dados do POST
    $userId = $_POST['IdCliente'];
    $lojaId = $_POST['IdLoja'];
    $produtoId = $_POST['IdProduto'];
    $favorito = $_POST['favorito'];

    // Verifique se as variáveis foram definidas
    if (!isset($userId, $lojaId, $produtoId, $favorito)) {
        echo "Dados incompletos.";
        exit;
    }

    // Preparar consulta para verificar se o cliente existe
    $existeCliente = "SELECT * FROM usuarios WHERE id = ?";
    
    // Prepare e execute a consulta
    $stmt = $conexao->prepare($existeCliente);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    // Verifique se o cliente existe
    if ($result->num_rows < 1) {
        echo "Usuário não existe.";
    } else {
        // Preparar consulta para inserir nos favoritos
        $inserirFavorito = "INSERT INTO favoritos (IdCliente, IdLoja, IdProduto, Favorito) VALUES (?, ?, ?, ?)";

        // Prepare a consulta
        $stmt = $conexao->prepare($inserirFavorito);
        $stmt->bind_param('iiis', $userId, $lojaId, $produtoId, $favorito);

        // Execute a consulta e verifique se foi bem-sucedida
        if ($stmt->execute()) {
            echo "Favorito inserido com sucesso.";
        } else {
            echo "Erro ao inserir favorito: " . $stmt->error;
        }
    }
}elseif ($_SERVER['REQUEST_METHOD'] == 'GET') {
    if (isset($_GET['IdCliente'])) {
        $userId = $_GET['IdCliente'];

        // Preparar consulta para obter os favoritos do cliente
        $obterFavoritos = "SELECT * FROM favoritos WHERE IdCliente = ?";

        // Prepare e execute a consulta
        $stmt = $conexao->prepare($obterFavoritos);
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        // Verifique se existem favoritos
        if ($result->num_rows > 0) {
            $favoritos = array();

            while ($row = $result->fetch_assoc()) {
                $favoritos[] = $row;
            }

            // Retornar a lista de favoritos em formato JSON
            header('Content-Type: application/json');
            echo json_encode($favoritos);
        } else {
            echo "Nenhum favorito encontrado para o usuário.";
        }
    } else {
        echo "IdCliente não fornecido.";
    }
} elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    parse_str(file_get_contents("php://input"), $deleteVars);
    if (isset($deleteVars['id'])) {
        $favoritoId = $deleteVars['id'];

        // Preparar consulta para deletar o favorito
        $deletarFavorito = "DELETE FROM favoritos WHERE id = ?";

        // Prepare a consulta
        $stmt = $conexao->prepare($deletarFavorito);
        $stmt->bind_param('i', $favoritoId);

        // Execute a consulta e verifique se foi bem-sucedida
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo "Favorito deletado com sucesso.";
            } else {
                echo "Favorito não encontrado.";
            }
        } else {
            echo "Erro ao deletar favorito: " . $stmt->error;
        }
    } else {
        echo "Id do favorito não fornecido.";
    }
}

>
