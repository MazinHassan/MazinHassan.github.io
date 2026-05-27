import { Vec2, Transform, Rect } from "./utils.js";

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

for (const c of data.hero.contacts) {
	const a = document.createElement("a");
	a.href = c.link;
	a.innerHTML = c.body;
	heroContacts.appendChild(a);
}

for (const f of data.hero.featured) {
	const a = document.createElement("a");
	a.href = f.link;

	const div = document.createElement("div");
	const p = document.createElement("p");
	p.textContent = f.body;

	const img = document.createElement("img");
	img.src = f.img;
	img.width = "100";

	a.appendChild(div);
	div.appendChild(img);
	div.appendChild(p);
	heroFeatured.appendChild(a);
}

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

const fragment = document.createDocumentFragment();

const sections = Object.entries(data.gallery).map(([key, value]) => {
	const mediaItems = value.map((i) => {
		const thumbnail = document.createElement("img");
		thumbnail.className = "gallery-media";
		thumbnail.src = `./thumbnails/${i.media.split("/").pop().split(".").slice(0, -1).join(".")}.jpg`;
		thumbnail.loading = "lazy";

		thumbnail.addEventListener("click", (e) => {
			if (!previewOpen) {
				preview(i.media, Rect.fromDomRect(e.target.getBoundingClientRect()));
				e.target.classList.add("hide");
			}
		});

		const description = document.createElement("p");
		description.innerText = i.description;

		const item = document.createElement("div");
		item.className = "gallery-item";
		item.appendChild(thumbnail);
		item.appendChild(description);

		loadingObserver.observe(item);

		return item;
	});

	const section = document.createElement("section");
	section.id = key;
	section.className = "gallery-section";

	if (key !== "uncategorized") {
		const header = document.createElement("h1");
		header.innerHTML = key;
		header.className = "gallery-section-header";
		section.appendChild(header);
	}

	const items = document.createElement("div");
	items.className = "gallery-section-items";
	items.append(...mediaItems);
	section.appendChild(items);

	return section;
});

for (const section of sections) {
	fragment.appendChild(section);
}

gallery.appendChild(fragment);

let previewOpen = false;

function preview(src, rect) {
	if (previewOpen) {
		return;
	}
	previewOpen = true;

	let media = null;

	if (/\.(mp4|mov|avi|webm|mkv)$/i.test(src)) {
		media = document.createElement("video");
		media.addEventListener("mouseenter", (e) => {
			e.target.setAttribute("controls", "controls");
		});
		media.addEventListener("mouseleave", () => {
			e.target.removeAttribute("controls");
		});

		const source = document.createElement("source");
		source.src = src;

		media.appendChild(source);
	} else {
		media = document.createElement("img");
		media.src = src;
		media.loading = "lazy";
	}

	media.classList.add("preview-media", "no-transition");

	requestAnimationFrame(() => {
		const mediaRatio = rect.size.x / rect.size.y;
		const windowRatio = window.innerWidth / window.innerHeight;

		if (mediaRatio > windowRatio) {
			media.style.width = "100%";
		} else {
			media.style.height = "100%";
		}

		const mediaRect = Rect.fromDomRect(media.getBoundingClientRect());

		const transform = new Transform(
			rect.center().sub(mediaRect.center()),
			rect.size.div(mediaRect.size).min(),
		);

		media.style.transform = transform.toStyle();
		media.dataset.initialTransform = transform.toStyle();

		requestAnimationFrame(() => {
			media.classList.remove("no-transition");
			media.style.transform = `translate(0px, 0px) scale(1)`;
		});
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

	const container = document.createElement("div");
	container.className = "preview-container";

	container.appendChild(media);
	container.appendChild(backdrop);

	let transform = Transform.default();
	let start = Vec2.zero();
	let isDragging = false;
	let pinch = {
		distance: 0,
		midpoint: Vec2.zero(),
		transform: Transform.default(),
	};
	let prevTapTime = 0;
	let prevTapPos = Vec2.zero();

	container.addEventListener("mousedown", (e) => {
		if (!previewOpen) {
			return;
		}

		e.preventDefault();
		start = Vec2.fromClient(e).sub(transform.translate);
		isDragging = true;
		media.classList.add("no-transition");
	});

	container.addEventListener("mousemove", (e) => {
		if (!previewOpen) {
			return;
		}

		if (isDragging) {
			transform.translate = Vec2.fromClient(e).sub(start);
			media.style.transform = transform.toStyle();
		}
	});

	container.addEventListener("mouseup", () => {
		if (!previewOpen) {
			return;
		}

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

	container.addEventListener("dblclick", (e) => {
		if (!previewOpen) {
			return;
		}

		e.preventDefault();

		if (transform.scale !== 1) {
			transform = Transform.default();
		} else {
			const rect = Rect.fromDomRect(container.getBoundingClientRect());
			const focus = Vec2.fromClient(e).sub(rect.center());

			const newScale = transform.scale * 2;

			transform.translate = transform.translate.sub(
				focus.sub(transform.translate).mul(newScale / transform.scale - 1),
			);
			transform.scale = newScale;
		}

		media.style.transform = transform.toStyle();
	});

	let wheelTimeout = null;
	container.addEventListener("wheel", (e) => {
		if (!previewOpen) {
			return;
		}

		e.preventDefault();

		const dir = e.deltaY < 0 ? 1 : -1;
		const newScale = Math.max(0.1, Math.min(5, transform.scale + dir * 0.1));

		const rect = Rect.fromDomRect(container.getBoundingClientRect());
		const focus = Vec2.fromClient(e).sub(rect.center());
		transform.translate = transform.translate.sub(
			focus.sub(transform.translate).mul(newScale / transform.scale - 1),
		);
		transform.scale = newScale;

		media.style.transform = transform.toStyle();

		clearTimeout(wheelTimeout);
		wheelTimeout = setTimeout(() => {
			if (transform.scale < 1) {
				transform = Transform.default();
				media.style.transform = transform.toStyle();
			}
		}, 100);
	});

	document.addEventListener("mouseleave", () => {
		if (!previewOpen) {
			return;
		}

		isDragging = false;
		media.classList.remove("no-transition");
		if (transform.scale === 1) {
			transform = Transform.default();
		}
		media.style.transform = transform.toStyle();
	});

	container.addEventListener("touchstart", (e) => {
		if (!previewOpen) {
			return;
		}

		e.preventDefault();

		media.classList.add("no-transition");

		if (e.touches.length === 1) {
			start = Vec2.fromClient(e.touches[0]).sub(transform.translate);
		} else if (e.touches.length === 2) {
			const touch1 = Vec2.fromClient(e.touches[0]);
			const touch2 = Vec2.fromClient(e.touches[1]);
			pinch = {
				distance: touch1.distance(touch2),
				transform: transform.copy(),
				midpoint: touch1.add(touch2).div(2),
			};
		}
	});

	container.addEventListener("touchmove", (e) => {
		if (!previewOpen) {
			return;
		}

		if (e.touches.length === 1) {
			transform.translate = Vec2.fromClient(e.touches[0]).sub(start);
		} else if (e.touches.length === 2) {
			const touch1 = Vec2.fromClient(e.touches[0]);
			const touch2 = Vec2.fromClient(e.touches[1]);

			const rect = Rect.fromDomRect(container.getBoundingClientRect());
			const focus = pinch.midpoint.sub(rect.center());

			const dist = touch1.distance(touch2);
			const midpoint = touch1.add(touch2).div(2);

			const newScale = Math.min(
				5,
				pinch.transform.scale * (dist / pinch.distance),
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

	container.addEventListener("touchend", (e) => {
		if (!previewOpen) {
			return;
		}

		if (e.changedTouches.length === 1) {
			const touch = Vec2.fromClient(e.changedTouches[0]);
			const dist = Math.abs(touch.distance(prevTapPos));
			prevTapPos = touch;

			const currentTime = Date.now();
			const tapLength = currentTime - prevTapTime;
			prevTapTime = currentTime;

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

					if (tapLength < 200 && dist < 50) {
						const rect = Rect.fromDomRect(container.getBoundingClientRect());
						const focus = touch.sub(rect.center());

						const newScale = transform.scale * 2;

						transform.translate = transform.translate.sub(
							focus
								.sub(transform.translate)
								.mul(newScale / transform.scale - 1),
						);
						transform.scale = newScale;

						media.style.transform = transform.toStyle();

						prevTapTime = 0;
					}
				}
			} else if (transform.scale < 1) {
				media.classList.remove("no-transition");
				transform = Transform.default();
				media.style.transform = transform.toStyle();
			} else if (transform.scale > 1) {
				if (tapLength < 200 && dist < 50) {
					media.classList.remove("no-transition");
					transform = Transform.default();
					media.style.transform = transform.toStyle();
					prevTapTime = 0;
				}
			}
		}

		if (e.touches.length === 1) {
			start = Vec2.fromClient(e.touches[0]).sub(transform.translate);
		}
	});

	document.body.appendChild(container);
}

function closePreview() {
	if (previewOpen) {
		previewOpen = false;

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
