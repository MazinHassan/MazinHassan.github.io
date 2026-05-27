import { Vec2, Transform, Rect } from "./../../utils.js";

const directionModifier =
	data.direction === "ltr" ? 1 : data.direction === "rtl" ? -1 : 1;

class Page {
	constructor(src, background, transform) {
		this.background = background;
		this.transform = transform;

		this.element = new Image();
		this.element.src = src;
		this.element.className = "image";
		this.element.addEventListener("transitionend", (e) => {
			const rect = e.target.getBoundingClientRect();
			if (
				rect.bottom <= 0 ||
				rect.top >= window.innerHeight ||
				rect.right <= 0 ||
				rect.left >= window.innerWidth
			) {
				e.target.remove();
			}
		});

		this.updateStyleTransform();
	}

	translate(pos) {
		this.transform.translate = pos;
		this.updateStyleTransform();
	}

	translateX(x) {
		this.transform.translate.x = x;
		this.updateStyleTransform();
	}

	translateY(y) {
		this.transform.translate.y = y;
		this.updateStyleTransform();
	}

	scale(s) {
		this.transform.scale = s;
		this.updateStyleTransform();
	}

	resetTransform() {
		this.transform.reset();
		this.updateStyleTransform();
	}

	updateStyleTransform() {
		this.element.style.transform = this.transform.toStyle();
	}
}

class Chapter {
	constructor(pages) {
		this.index = 0;
		this.pages = pages;
		this.loadedPages = [];
	}

	currentPage() {
		return this.getPage(this.index);
	}

	nextPage() {
		this.index = Math.min(this.index + 1, this.pages.length - 1);
		return this.getPage(this.index);
	}

	prevPage() {
		this.index = Math.max(this.index - 1, 0);
		return this.getPage(this.index);
	}

	getPage(index) {
		for (let i = this.loadedPages.length; i < index + 2; ++i) {
			if (i < this.pages.length) {
				this.loadedPages.push(
					new Page(
						this.pages[i].src,
						this.pages[i].background,
						new Transform(
							new Vec2(i === 0 ? 0 : window.innerWidth * directionModifier, 0),
							1,
						),
					),
				);
			}
		}
		return this.loadedPages[index];
	}

	isFirstPage() {
		return this.index === 0;
	}

	isLastPage() {
		return this.index === this.pages.length - 1;
	}
}

const viewer = document.getElementById("viewer");
const chapter = new Chapter(data.pages);

function nextPage() {
	if (!chapter.isLastPage()) {
		chapter
			.currentPage()
			.translateX(window.innerWidth * (-1 * directionModifier));
		setPage(chapter.nextPage());
	}
}

function prevPage() {
	if (!chapter.isFirstPage()) {
		chapter.currentPage().translateX(window.innerWidth * directionModifier);
		setPage(chapter.prevPage());
	}
}

function setPage(page) {
	viewer.appendChild(page.element);
	setTimeout(() => {
		page.resetTransform();
		viewer.style.backgroundColor = page.background;
	}, 10);
}

setPage(chapter.currentPage());

let start = Vec2.zero();
let isDragging = false;
let pinch = {
	distance: 0,
	midpoint: Vec2.zero(),
	transform: Transform.default(),
};
let prevTapTime = 0;
let prevTapPos = Vec2.zero();

viewer.addEventListener("mousedown", (e) => {
	e.preventDefault();
	const page = chapter.currentPage();
	start = Vec2.fromClient(e).sub(page.transform.translate);
	isDragging = true;
	page.element.classList.add("no-transition");
});

viewer.addEventListener("mousemove", (e) => {
	if (isDragging) {
		const page = chapter.currentPage();
		page.transform.translate = Vec2.fromClient(e).sub(start);
		page.updateStyleTransform();
	}
});

viewer.addEventListener("mouseup", (e) => {
	const page = chapter.currentPage();

	isDragging = false;
	page.element.classList.remove("no-transition");

	if (page.transform.scale === 1) {
		page.resetTransform();

		const deltaX = e.clientX - start.x;
		if (Math.abs(deltaX) > 50) {
			if (deltaX * directionModifier > 0) {
				prevPage();
			} else {
				nextPage();
			}
		}
	}
});

viewer.addEventListener("dblclick", (e) => {
	e.preventDefault();

	const page = chapter.currentPage();

	if (page.transform.scale === 1) {
		const rect = Rect.fromDomRect(viewer.getBoundingClientRect());
		const focus = Vec2.fromClient(e).sub(rect.center());

		const newScale = page.transform.scale * 2;

		page.transform.translate = page.transform.translate.sub(
			focus
				.sub(page.transform.translate)
				.mul(newScale / page.transform.scale - 1),
		);
		page.transform.scale = newScale;

		page.updateStyleTransform();
	} else {
		page.resetTransform();
	}
});

let wheelTimeout = null;
viewer.addEventListener("wheel", (e) => {
	e.preventDefault();

	const page = chapter.currentPage();

	const dir = e.deltaY < 0 ? 1 : -1;
	const newScale = Math.max(0.1, Math.min(5, page.transform.scale + dir * 0.1));

	const rect = Rect.fromDomRect(viewer.getBoundingClientRect());
	const focus = Vec2.fromClient(e).sub(rect.center());
	page.transform.translate = page.transform.translate.sub(
		focus
			.sub(page.transform.translate)
			.mul(newScale / page.transform.scale - 1),
	);
	page.transform.scale = newScale;

	page.updateStyleTransform();

	clearTimeout(wheelTimeout);
	wheelTimeout = setTimeout(() => {
		if (page.transform.scale < 1) {
			page.resetTransform();
		}
	}, 100);
});

document.addEventListener("mouseleave", () => {
	const page = chapter.currentPage();
	isDragging = false;
	page.element.classList.remove("no-transition");
	if (page.transform.scale === 1) {
		page.resetTransform();
	}
});

viewer.addEventListener("touchstart", (e) => {
	e.preventDefault();

	const page = chapter.currentPage();

	page.element.classList.add("no-transition");

	if (e.touches.length === 1) {
		start = Vec2.fromClient(e.touches[0]).sub(page.transform.translate);
	} else if (e.touches.length === 2) {
		const touch1 = Vec2.fromClient(e.touches[0]);
		const touch2 = Vec2.fromClient(e.touches[1]);
		pinch = {
			distance: touch1.distance(touch2),
			transform: page.transform.copy(),
			midpoint: touch1.add(touch2).div(2),
		};
	}
});

viewer.addEventListener("touchmove", (e) => {
	const page = chapter.currentPage();

	if (e.touches.length === 1) {
		page.translate(Vec2.fromClient(e.touches[0]).sub(start));
	} else if (e.touches.length === 2) {
		const touch1 = Vec2.fromClient(e.touches[0]);
		const touch2 = Vec2.fromClient(e.touches[1]);

		const rect = Rect.fromDomRect(viewer.getBoundingClientRect());
		const focus = pinch.midpoint.sub(rect.center());

		const dist = touch1.distance(touch2);
		const midpoint = touch1.add(touch2).div(2);

		const newScale = Math.min(
			5,
			pinch.transform.scale * (dist / pinch.distance),
		);

		page.transform.translate = pinch.transform.translate
			.add(midpoint.sub(pinch.midpoint))
			.sub(
				focus
					.sub(pinch.transform.translate)
					.mul(newScale / pinch.transform.scale - 1),
			);
		page.transform.scale = newScale;

		page.updateStyleTransform();
	}
});

viewer.addEventListener("touchend", (e) => {
	const page = chapter.currentPage();

	if (e.changedTouches.length === 1) {
		const touch = Vec2.fromClient(e.changedTouches[0]);
		const dist = Math.abs(touch.distance(prevTapPos));
		prevTapPos = touch;

		const currentTime = Date.now();
		const tapLength = currentTime - prevTapTime;
		prevTapTime = currentTime;

		if (page.transform.scale === 1) {
			page.resetTransform();
			page.element.classList.remove("no-transition");

			const deltaX = touch.x - start.x;
			if (Math.abs(deltaX) > 50) {
				if (deltaX * directionModifier > 0) {
					prevPage();
				} else {
					nextPage();
				}
			} else {
				page.resetTransform();
				page.element.classList.remove("no-transition");

				if (tapLength < 200 && dist < 50) {
					const rect = Rect.fromDomRect(viewer.getBoundingClientRect());
					const focus = touch.sub(rect.center());

					const newScale = page.transform.scale * 2;

					page.transform.translate = page.transform.translate.sub(
						focus
							.sub(page.transform.translate)
							.mul(newScale / page.transform.scale - 1),
					);
					page.transform.scale = newScale;

					page.updateStyleTransform();

					prevTapTime = 0;
				}
			}
		} else if (page.transform.scale < 1) {
			page.resetTransform();
			page.element.classList.remove("no-transition");
		} else if (page.transform.scale > 1) {
			if (tapLength < 200 && dist < 50) {
				page.resetTransform();
				page.element.classList.remove("no-transition");
				prevTapTime = 0;
			}
		}
	}

	if (e.touches.length === 1) {
		start = Vec2.fromClient(e.touches[0]).sub(page.transform.translate);
	}
});

document.addEventListener("touchstart", (e) => {
	if (e.touches.length > 1) {
		e.preventDefault();
	}
});

document.addEventListener("touchmove", (e) => {
	if (e.touches.length > 1) {
		e.preventDefault();
	}
});

document.addEventListener("touchcancel", () => {
	page.resetTransform();
	page.element.classList.remove("no-transition");
});

document.addEventListener("keydown", (e) => {
	const page = chapter.currentPage();

	switch (e.key) {
		case "ArrowLeft": {
			if (page.transform.scale !== 1) {
				page.transform.translate.x += 100;
				page.updateStyleTransform();
			} else {
				switch (data.direction) {
					case "ltr":
						prevPage();
						break;
					case "rtl":
						nextPage();
						break;
					default:
						prevPage();
						break;
				}
			}
			break;
		}
		case "ArrowRight": {
			if (page.transform.scale !== 1) {
				page.transform.translate.x -= 100;
				page.updateStyleTransform();
			} else {
				switch (data.direction) {
					case "ltr":
						nextPage();
						break;
					case "rtl":
						prevPage();
						break;
					default:
						nextPage();
						break;
				}
			}
			break;
		}
		case "ArrowUp": {
			if (page.transform.scale !== 1) {
				page.transform.translate.y += 100;
				page.updateStyleTransform();
			}
			break;
		}
		case "ArrowDown": {
			if (page.transform.scale !== 1) {
				page.transform.translate.y -= 100;
				page.updateStyleTransform();
			}
			break;
		}
		case "+": {
			page.transform.scale = Math.min(page.transform.scale + 0.25, 3);
			page.updateStyleTransform();
			break;
		}
		case "-": {
			page.transform.scale = Math.max(page.transform.scale - 0.25, 0.5);
			page.updateStyleTransform();
			break;
		}
		case "0":
			page.updateStyleTransform();
			break;
	}
});

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
