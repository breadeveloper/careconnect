document.addEventListener("DOMContentLoaded", function () {
    const infoSection = document.querySelector(".info");

    if (!infoSection) return; // Ensure element exists

    let lastScrollY = window.scrollY;

    function handleScroll() {
        const sectionTop = infoSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (sectionTop < windowHeight * 0.8 && sectionTop > -infoSection.clientHeight * 0.2) {
            if (window.scrollY > lastScrollY) {
                // Scrolling down
                infoSection.classList.add("slide-down");
                infoSection.classList.remove("slide-up");
            } else {
                // Scrolling up
                infoSection.classList.add("slide-up");
                infoSection.classList.remove("slide-down");
            }
        }

        lastScrollY = window.scrollY;
    }

    window.addEventListener("scroll", handleScroll);
});
