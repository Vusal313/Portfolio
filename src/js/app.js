document.addEventListener("DOMContentLoaded", function() {
    // Yükleme animasyonu
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.style.display = 'none';
    }, 500);

    // Menü geçişi
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');
    
    menuToggle.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });

    // Navbar'da yumuşak geçiş
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
            navbar.classList.remove('active');
        });
    });

    // Fare takip noktası
    document.addEventListener("mousemove", function (event) {
        const cursorDot = document.querySelector(".cursor-dot");
        const mouseX = event.clientX; // Fare imleci X koordinatı
        const mouseY = event.clientY; // Fare imleci Y koordinatı
    
        // İmleci tam ucuna yerleştirmek için offset uygula
        const offsetX = 0; // Noktayı X ekseninde ofsetle (0)
        const offsetY = 0; // Noktayı Y ekseninde ofsetle (0)
    
        cursorDot.style.left = `${mouseX + offsetX}px`; // Noktanın sol pozisyonu
        cursorDot.style.top = `${mouseY + offsetY}px`; // Noktanın üst pozisyonu
    });
    
});

document.getElementById("phone-link").addEventListener("click", function(event) {
    // Telefon bağlantısını açar
    window.location.href = "tel:+994702148307";
});

document.getElementById("whatsapp-link").addEventListener("click", function(event) {
    // WhatsApp bağlantısını açar
    window.open("https://wa.me/994702148307", "_blank");
});

document.getElementById("email-link").addEventListener("click", function(event) {
    // E-posta uygulamasını açar
    window.location.href = "mailto:muradovvusal565@gmail.com";
    // Uyarı mesajı (isteğe bağlı)
    alert("E-posta uygulamanız açılacak: muradovvusal565@gmail.com");
});

document.getElementById("phone-link").addEventListener("click", function(event) {
    // Telefon uygulamasını açar
    window.location.href = "tel:+994702148307";
    // Uyarı mesajı (isteğe bağlı)
    alert("Telefon uygulamanız açılacak: +994 70 214 83 07");
});