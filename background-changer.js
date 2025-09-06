document.addEventListener('DOMContentLoaded', () => {
    const backgroundImages = [
        'img/fundo1.jpg', // VERIFIQUE AQUI: o nome do seu arquivo e a extensão.
        'img/fundo2.jpg',
        'img/fundo3.jpg'
        // Adicione mais caminhos aqui
    ];

    const backgroundContainer = document.querySelector('.background-container');

    function setRandomBackground() {
        if (backgroundImages.length === 0) {
            console.warn("Nenhuma imagem de fundo configurada em background-changer.js");
            return;
        }
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        const randomImage = backgroundImages[randomIndex];
        backgroundContainer.style.backgroundImage = `url('${randomImage}')`;
    }

    setRandomBackground();
});