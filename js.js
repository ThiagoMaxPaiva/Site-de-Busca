function procuraP(){
 
    var pesquisaP = document.getElementById('campo de pesquisa').value; // para receber os dados de buscar
    var url =  "https://mercado-libre4.p.rapidapi.com/search?search=" + encodeURI(pesquisaP) +  "BR&offset=0&limit=20";
    // aqui vamos pegar a utl e conseguir pesquisa pelo pais

    fetch


}