// Menü geçişi

const menuToggle = document.querySelector(".menu-toggle");
const navbar = document.querySelector(".navbar");

// Menü toggle'ı kontrol et
if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => {
        navbar.classList.toggle("active");
    });
}

// Navbar'da yumuşak geçiş
document.querySelectorAll("nav a").forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
            behavior: "smooth",
        });
        navbar.classList.remove("active");
    });
});

// Telefon bağlantısını açar
document.getElementById("phone-link").addEventListener("click", function (e) {
    e.preventDefault();
    window.location.href = "tel:+994702148307";
});

// WhatsApp bağlantısını açar
document.querySelector(".whatsapp-icon").addEventListener("click", function () {
    window.open("https://wa.me/994702148307", "_blank");
});

// E-posta uygulamasını açar
document.getElementById("email-link").addEventListener("click", function (e) {
    e.preventDefault();
    window.location.href = "mailto:muradovvusal565@gmail.com";
});

// LinkedIn bağlantısını açar
document.querySelector(".linkedin-icon").addEventListener("click", function () {
    window.open("https://www.linkedin.com/in/muradovvusal", "_blank");
});

// GitHub bağlantısını açar
document.querySelector(".github-icon").addEventListener("click", function () {
    window.open("https://github.com/muradovvusal", "_blank");
});

// Fare takip noktası için değişken
const cursorDot = document.querySelector(".cursor-dot");

// Hareketin akıcılığını artırmak için değişkenler
let mouseX = 0;
let mouseY = 0;

// Fare hareketi dinleyicisi
document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Fare noktasının pozisyonunu güncellemek için fonksiyon
function updateCursor() {
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
    requestAnimationFrame(updateCursor);
}

// İlk güncellemeyi başlat
updateCursor();
    
// Sayfa yüklendiğinde yükleme animasyonunu gizleme
window.addEventListener('load', () => {
    document.getElementById('loader').style.display = 'none';
});


// Menü linklerine tıklama animasyonu
document.querySelectorAll('.navbar a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.navbar').classList.remove('active');
    });
});



// Yumuşak geçişler için JavaScript
document.querySelectorAll('.navbar a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        window.scrollTo({
            top: target.offsetTop,
            behavior: 'smooth'
        });
    });
});
