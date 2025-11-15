"use strict";

import { Vec2, Transform } from "./utils.js";

document.title = data.title;

const hero = document.querySelector(".hero");
const heroContent = document.querySelector(".hero-content");
const heroName = document.querySelector(".hero-name");
const heroDescription = document.querySelector(".hero-description");
const heroContacts = document.querySelector(".hero-contacts");
const heroFeatured = document.querySelector(".hero-featured");
const gallery = document.querySelector(".gallery");

hero.style.backgroundImage = `url('${data.hero.image}')`;
heroName.innerHTML = `${data.hero.first_name}</br>${data.hero.last_name}`;
heroDescription.innerHTML = data.hero.description;
heroContacts.innerHTML = data.hero.contacts
  .map((c) => `<a href="${c.link}">${c.body}</a>`)
  .join("");
heroFeatured.innerHTML = `
	<a href="${data.hero.featured.url}">
		<div>
			<img src="${data.hero.featured.img}" width="100%">
			<p>${data.hero.featured.title}<p>
		</div>
	</a>
  `;

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

const fragment = document.createDocumentFragment();

const galleryItems = data.gallery.map((i) => {
  let mediaElement = document.createElement("img");
  mediaElement.className = "gallery-media";
  mediaElement.src = `./thumbnails/${i.media.split("/").pop().split(".").slice(0, -1).join(".")}.jpg`;
  mediaElement.loading = "lazy";

  mediaElement.addEventListener("click", (e) => {
    const rect = e.target.getBoundingClientRect();
    preview(i.media, rect.left, rect.top, rect.width, rect.height);
    e.target.classList.add("hide");
  });

  const description = document.createElement("p");
  description.innerText = i.description;

  const item = document.createElement("div");
  item.className = "gallery-item";
  item.appendChild(mediaElement);
  item.appendChild(description);

  return item;
});

for (const item of galleryItems) {
  fragment.appendChild(item);
}

gallery.appendChild(fragment);

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

function preview(src, x, y, w, h) {
  if (document.querySelector(".preview-container") !== null) {
    return;
  }

  let media = null;

  if (/\.(mp4|mov|avi|webm|mkv)$/i.test(src)) {
    media = document.createElement("video");

    const source = document.createElement("source");
    source.src = src;

    media.appendChild(source);
    media.addEventListener("mouseenter", function () {
      this.setAttribute("controls", "controls");
    });

    media.addEventListener("mouseleave", function () {
      this.removeAttribute("controls");
    });
  } else {
    media = document.createElement("img");
    media.src = src;
    media.loading = "lazy";
  }

  media.classList.add("preview-media", "no-transition");

  requestAnimationFrame(() => {
    const mediaRatio = w / h;
    const windowRatio = window.innerWidth / window.innerHeight;

    if (mediaRatio > windowRatio) {
      media.style.width = "100%";
    } else {
      media.style.height = "100%";
    }

    const rect = media.getBoundingClientRect();

    const thumbCenter = new Vec2(x + w / 2, y + h / 2);
    const mediaCenter = new Vec2(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    const thumScale = Math.min(w / rect.width, h / rect.height);

    const transform = new Transform(thumbCenter.sub(mediaCenter), thumScale);

    media.style.transform = transform.toStyle();
    media.dataset.initialTransform = transform.toStyle();

    requestAnimationFrame(() => {
      media.classList.remove("no-transition");
      media.style.transform = `translate(0px, 0px) scale(1)`;
    });
  });

  let transform = Transform.default();
  let start = new Vec2(0, 0);
  let isDragging = false;

  media.addEventListener("mousedown", (e) => {
    e.preventDefault();
    start = new Vec2(e.clientX, e.clientY).sub(transform.translate);
    isDragging = true;
    media.classList.add("no-transition");
  });

  media.addEventListener("mousemove", (e) => {
    if (isDragging) {
      transform.translate = new Vec2(e.clientX, e.clientY).sub(start);
      media.style.transform = transform.toStyle();
    }
  });

  media.addEventListener("mouseup", () => {
    isDragging = false;
    media.classList.remove("no-transition");

    if (transform.scale === 1) {
      if (
        Math.abs(transform.translate.x) > 200 ||
        Math.abs(transform.translate.y) > 200
      ) {
        closePreview();
      } else {
        transform = Transform.default();
        media.style.transform = transform.toStyle();
      }
    }
  });

  media.addEventListener("dblclick", (e) => {
    e.preventDefault();

    if (transform.scale !== 1) {
      transform = Transform.default();
    } else {
      const newScale = transform.scale * 2;
      const rect = container.getBoundingClientRect();

      const focus = new Vec2(
        e.clientX - rect.left - rect.width / 2,
        e.clientY - rect.top - rect.height / 2,
      );

      transform.translate = transform.translate.sub(
        focus.sub(transform.translate).mul(newScale / transform.scale - 1),
      );
      transform.scale = newScale;
    }

    media.style.transform = transform.toStyle();
  });

  media.addEventListener("wheel", (e) => {
    e.preventDefault();

    const dir = e.deltaY < 0 ? 1 : -1;
    const newScale = Math.max(1, Math.min(5, transform.scale + dir * 0.1));

    if (newScale > 1) {
      const rect = container.getBoundingClientRect();

      const focus = new Vec2(
        e.clientX - rect.left - rect.width / 2,
        e.clientY - rect.top - rect.height / 2,
      );

      transform.translate = transform.translate.sub(
        focus.sub(transform.translate).mul(newScale / transform.scale - 1),
      );
      transform.scale = newScale;
    } else {
      transform = Transform.default();
    }

    media.style.transform = transform.toStyle();
  });

  document.addEventListener("mouseleave", () => {
    isDragging = false;
    media.classList.remove("no-transition");
    if (transform.scale === 1) {
      transform = Transform.default();
    }
    media.style.transform = transform.toStyle();
  });

  let pinch = {
    distance: 0,
    midpoint: new Vec2(0, 0),
    transform: new Transform(new Vec2(0, 0), 0),
  };

  media.addEventListener("touchstart", (e) => {
    e.preventDefault();

    media.classList.add("no-transition");

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      start.x = touch.clientX - transform.translate.x;
      start.y = touch.clientY - transform.translate.y;
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      pinch = {
        distance: distance(
          touch1.clientX,
          touch1.clientY,
          touch2.clientX,
          touch2.clientY,
        ),
        transform: transform.copy(),
        midpoint: new Vec2(
          (touch1.clientX + touch2.clientX) / 2,
          (touch1.clientY + touch2.clientY) / 2,
        ),
      };
    }
  });

  media.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      transform.translate = new Vec2(
        e.touches[0].clientX - start.x,
        e.touches[0].clientY - start.y,
      );
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const dist = distance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY,
      );

      const midpoint = new Vec2(
        (touch1.clientX + touch2.clientX) / 2,
        (touch1.clientY + touch2.clientY) / 2,
      );

      const newScale = Math.min(
        5,
        pinch.transform.scale * (dist / pinch.distance),
      );
      const rect = container.getBoundingClientRect();
      const focus = new Vec2(
        pinch.midpoint.x - rect.left - rect.width / 2,
        pinch.midpoint.y - rect.top - rect.height / 2,
      );

      transform.translate = pinch.transform.translate
        .add(midpoint.sub(pinch.midpoint))
        .sub(
          focus
            .sub(pinch.transform.translate)
            .mul(newScale / pinch.transform.scale - 1),
        );

      transform.scale = newScale;
    }

    media.style.transform = transform.toStyle();
  });

  let prevTap = 0;
  const lastTapPos = new Vec2(0, 0);

  media.addEventListener("touchend", (e) => {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];

      const currentTime = new Date().getTime();
      const tapLength = currentTime - prevTap;
      const distanceX = Math.abs(touch.clientX - lastTapPos.x);
      const distanceY = Math.abs(touch.clientY - lastTapPos.y);
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      prevTap = currentTime;
      lastTapPos.x = touch.clientX;
      lastTapPos.y = touch.clientY;

      if (transform.scale === 1) {
        media.classList.remove("no-transition");

        if (
          Math.abs(transform.translate.x) > 200 ||
          Math.abs(transform.translate.y) > 200
        ) {
          closePreview();
        } else {
          transform = Transform.default();
          media.style.transform = transform.toStyle();

          if (tapLength < 200 && distance < 50) {
            const newScale = transform.scale * 2;
            const rect = container.getBoundingClientRect();

            const focus = new Vec2(
              touch.clientX - rect.left - rect.width / 2,
              touch.clientY - rect.top - rect.height / 2,
            );

            transform.translate = transform.translate.sub(
              focus
                .sub(transform.translate)
                .mul(newScale / transform.scale - 1),
            );
            transform.scale = newScale;

            media.style.transform = transform.toStyle();

            prevTap = 0;
          }
        }
      } else if (transform.scale < 1) {
        media.classList.remove("no-transition");
        transform = Transform.default();
        media.style.transform = transform.toStyle();
      } else if (transform.scale > 1) {
        if (tapLength < 200 && distance < 50) {
          media.classList.remove("no-transition");
          transform = Transform.default();
          media.style.transform = transform.toStyle();
          prevTap = 0;
        }
      }
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      start = new Vec2(
        touch.clientX - transform.translate.x,
        touch.clientY - transform.translate.y,
      );
    }
  });

  const backdrop = document.createElement("div");
  backdrop.className = "preview-backdrop";
  backdrop.style.opacity = 0;
  requestAnimationFrame(() => {
    backdrop.style.opacity = 0.5;
  });

  backdrop.addEventListener("click", () => {
    closePreview();
  });

  backdrop.addEventListener("touchend", (e) => {
    if (e.changedTouches.length === 1) {
      closePreview();
    }
  });

  const container = document.createElement("div");
  container.className = "preview-container";

  container.appendChild(media);
  container.appendChild(backdrop);

  container.addEventListener("wheel", (e) => {
    e.preventDefault();
  });

  container.addEventListener("touchstart", (e) => {
    e.preventDefault();
  });

  container.addEventListener("touchmove", (e) => {
    e.preventDefault();
  });

  container.addEventListener("touchend", (e) => {
    e.preventDefault();
  });

  document.body.appendChild(container);
}

function closePreview() {
  const container = document.querySelector(".preview-container");

  if (container) {
    const media = container.querySelector(".preview-media");
    const backdrop = container.querySelector(".preview-backdrop");
    const hidden = document.querySelector(".hide");

    if (media) {
      media.style.transform = media.dataset.initialTransform;
    }

    if (backdrop) {
      backdrop.style.opacity = "0";
    }

    if (hidden) {
      setTimeout(() => {
        hidden.classList.remove("hide");
      }, 300);
    }

    setTimeout(() => {
      container.remove();
    }, 300);
  }
}

document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG") {
    e.preventDefault();
  }
});

document.addEventListener("touchstart", (e) => {
  if (e.target.tagName === "IMG") {
    e.preventDefault();
  }
});

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
