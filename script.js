document.title = data.title;

const hero = document.querySelector(".hero");
const heroContent = document.querySelector(".hero-content");
const heroName = document.querySelector(".hero-name");
const heroDescription = document.querySelector(".hero-description");
const heroContacts = document.querySelector(".hero-contacts");
const gallery = document.querySelector(".gallery");

hero.style.backgroundImage = `url('${data.hero.image}')`;
heroName.innerHTML = `${data.hero.first_name}</br>${data.hero.last_name}`;
heroDescription.innerHTML = data.hero.description;
heroContacts.innerHTML = data.hero.contacts
  .map((c) => `<a href="${c.link}">${c.body}</a>`)
  .join("");

const heroObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        heroContent.style.color = "black";
      } else {
        heroContent.style.color = "white";
      }
    });
  },
  { threshold: 0.1 },
);

heroObserver.observe(hero);

gallery.innerHTML += data.gallery
  .map((i) => {
    const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(i.media);
    const media = isVideo
      ? `<video class="gallery-media" onmouseenter="this.setAttribute('controls', 'controls')" onmouseleave="this.removeAttribute('controls')"><source src="${i.media}" onload="this.classList.remove('loading')"></video>`
      : `<img class="gallery-media" src="${i.media}" loading="lazy" />`;

    return `
				<div class="gallery-item">
					${media}
					<p>${i.description}</p>
				</div>
			`;
  })
  .join("");

const loadingObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "none";
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 },
);

for (const child of gallery.children) {
  loadingObserver.observe(child);
}
