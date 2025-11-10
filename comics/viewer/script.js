"use strict";

class Page {
  constructor(src, background) {
    this.background = background;
    this.transform = {
      scale: 1,
      translate: { x: window.innerWidth, y: 0 },
    };

    this.img = new Image();
    this.img.src = src;
    this.img.className = "image";
    this.img.addEventListener("transitionend", (e) => {
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

  translate(x, y) {
    this.transform.translate.x = x;
    this.transform.translate.y = y;
    this.updateStyleTransform();
  }

  scale(s) {
    this.transform.scale = s;
    this.updateStyleTransform();
  }

  updateStyleTransform() {
    this.img.style.transform = `translate(${this.transform.translate.x}px, ${this.transform.translate.y}px) scale(${this.transform.scale})`;
  }
}

class Chapter {
  constructor(pages) {
    this.index = 0;
    this.pages = pages;
    this.loadedPages = [];
  }

  getCurrentPage() {
    return this.getPage(0);
  }

  getPage(index) {
    for (let i = this.loadedPages.length; i < index + 2; ++i) {
      if (i < this.pages.length) {
        this.loadedPages.push(
          new Page(this.pages[i].src, this.pages[i].background),
        );
      }
    }
    return this.loadedPages[index];
  }

  nextPage() {
    const newIndex = this.index + 1;
    if (newIndex < this.pages.length) {
      const currPage = this.getCurrentPage();
      currPage.translate(-window.innerWidth, currPage.transform.translate.y);
      this.index = newIndex;
      return this.getPage(newIndex);
    }
  }

  prevPage() {
    const newIndex = page.index - 1;
    if (newIndex >= 0) {
      const currPage = this.getCurrentPage();
      currPage.translate(window.innerWidth, currPage.transform.translate.y);
      this.index = newIndex;
      return this.getPage(newIndex);
    }
  }
}

const chapter = new Chapter(pages);

console.log(chapter.getCurrentPage());

const viewer = document.getElementById("viewer");

const loadedPages = [];

const page = {
  index: 0,
  element: viewer.appendChild(getPage(0)),
  transform: {
    scale: 1,
    translate: { x: 0, y: 0 },
  },
};

resetTranform();

document.body.style.backgroundColor = pages[0].background;

function getPage(index) {
  for (let i = loadedPages.length; i < index + 2; ++i) {
    if (i < pages.length) {
      const img = new Image();
      img.src = pages[i].src;
      img.className = "image";
      img.style.transform = `translate(${window.innerWidth}px, 0px)`;
      img.addEventListener("transitionend", (e) => {
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
      loadedPages.push(img);
    }
  }
  return loadedPages[index];
}

function prevPage() {
  const newIndex = page.index - 1;
  if (newIndex >= 0) {
    page.transform.translate.x = window.innerWidth;
    applyTransform();
    page.element = viewer.appendChild(getPage(newIndex));
    page.index = newIndex;
    setTimeout(() => {
      resetTranform();
      document.body.style.backgroundColor = pages[newIndex].background;
    }, 10);
  }
}

function nextPage() {
  const newIndex = page.index + 1;
  if (newIndex < pages.length) {
    page.transform.translate.x = -window.innerWidth;
    applyTransform();
    page.element = viewer.appendChild(getPage(newIndex));
    page.index = newIndex;
    setTimeout(() => {
      resetTranform();
      document.body.style.backgroundColor = pages[newIndex].background;
    }, 10);
  }
}

function resetTranform() {
  page.transform.scale = 1;
  page.transform.translate.x = 0;
  page.transform.translate.y = 0;
  page.element.classList.remove("dragging");
  applyTransform();
}

function applyTransform() {
  page.element.style.transform = `translate(${page.transform.translate.x}px, ${page.transform.translate.y}px) scale(${page.transform.scale})`;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

const start = { x: 0, y: 0 };
let isDragging = false;

viewer.addEventListener("mousedown", (e) => {
  e.preventDefault();

  start.x = e.clientX - page.transform.translate.x;
  start.y = e.clientY - page.transform.translate.y;

  isDragging = true;
  page.element.classList.add("dragging");
});

viewer.addEventListener("mousemove", (e) => {
  if (isDragging) {
    page.transform.translate.x = e.clientX - start.x;
    page.transform.translate.y = e.clientY - start.y;
    applyTransform();
  }
});

viewer.addEventListener("mouseup", (e) => {
  isDragging = false;
  page.element.classList.remove("dragging");

  if (page.transform.scale === 1) {
    resetTranform();

    const deltaX = e.clientX - start.x;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        prevPage();
      } else {
        nextPage();
      }
    }
  }
});

viewer.addEventListener("dblclick", (e) => {
  e.preventDefault();

  if (page.transform.scale === 1) {
    const rect = viewer.getBoundingClientRect();

    const prevScale = page.transform.scale;
    page.transform.scale *= 2;

    const scaleDiff = page.transform.scale - prevScale;

    page.transform.translate.x -=
      ((e.clientX - rect.left - rect.width / 2 - page.transform.translate.x) *
        scaleDiff) /
      prevScale;
    page.transform.translate.y -=
      ((e.clientY - rect.top - rect.height / 2 - page.transform.translate.y) *
        scaleDiff) /
      prevScale;

    applyTransform();
  } else {
    resetTranform();
  }
});

viewer.addEventListener("wheel", (e) => {
  e.preventDefault();

  const dir = e.deltaY < 0 ? 1 : -1;
  const prevScale = page.transform.scale;
  page.transform.scale = Math.max(
    1,
    Math.min(5, page.transform.scale + dir * 0.1),
  );

  if (page.transform.scale > 1) {
    const rect = viewer.getBoundingClientRect();
    const scaleDiff = page.transform.scale - prevScale;

    page.transform.translate.x -=
      ((e.clientX - rect.left - rect.width / 2 - page.transform.translate.x) *
        scaleDiff) /
      prevScale;
    page.transform.translate.y -=
      ((e.clientY - rect.top - rect.height / 2 - page.transform.translate.y) *
        scaleDiff) /
      prevScale;

    applyTransform();
  } else {
    resetTranform();
  }
});

const pinch = {
  distance: 0,
  midpoint: { x: 0, y: 0 },
  transform: {
    scale: 1,
    translate: { x: 0, y: 0 },
  },
};

viewer.addEventListener("touchstart", (e) => {
  e.preventDefault();

  page.element.classList.add("dragging");

  if (e.touches.length === 1) {
    const touch = e.touches[0];
    start.x = touch.clientX - page.transform.translate.x;
    start.y = touch.clientY - page.transform.translate.y;
  } else if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    pinch.distance = distance(
      touch1.clientX,
      touch1.clientY,
      touch2.clientX,
      touch2.clientY,
    );
    pinch.transform.scale = page.transform.scale;
    pinch.transform.translate.x = page.transform.translate.x;
    pinch.transform.translate.y = page.transform.translate.y;
    pinch.midpoint.x = (touch1.clientX + touch2.clientX) / 2;
    pinch.midpoint.y = (touch1.clientY + touch2.clientY) / 2;
  }
});

viewer.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1) {
    page.transform.translate.x = e.touches[0].clientX - start.x;
    page.transform.translate.y = e.touches[0].clientY - start.y;
    applyTransform();
  } else if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    const dist = distance(
      touch1.clientX,
      touch1.clientY,
      touch2.clientX,
      touch2.clientY,
    );

    const rect = viewer.getBoundingClientRect();

    page.transform.scale = Math.min(
      5,
      pinch.transform.scale * (dist / pinch.distance),
    );
    const scaleDiff = page.transform.scale - pinch.transform.scale;

    page.transform.translate.x =
      pinch.transform.translate.x +
      ((touch1.clientX + touch2.clientX) / 2 - pinch.midpoint.x) -
      ((pinch.midpoint.x -
        (rect.left + rect.width / 2) -
        pinch.transform.translate.x) *
        scaleDiff) /
        pinch.transform.scale;

    page.transform.translate.y =
      pinch.transform.translate.y +
      ((touch1.clientY + touch2.clientY) / 2 - pinch.midpoint.y) -
      ((pinch.midpoint.y -
        (rect.top + rect.height / 2) -
        pinch.transform.translate.y) *
        scaleDiff) /
        pinch.transform.scale;

    applyTransform();
  }
});

let prevTap = 0;
const lastTapPos = { x: 0, y: 0 };

viewer.addEventListener("touchend", (e) => {
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

    if (page.transform.scale === 1) {
      resetTranform();

      const deltaX = touch.clientX - start.x;
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          prevPage();
        } else {
          nextPage();
        }
      }

      if (tapLength < 200 && distance < 50) {
        const rect = viewer.getBoundingClientRect();

        const prevScale = page.transform.scale;
        page.transform.scale *= 2;

        const scaleDiff = page.transform.scale - prevScale;

        page.transform.translate.x -=
          ((touch.clientX -
            rect.left -
            rect.width / 2 -
            page.transform.translate.x) *
            scaleDiff) /
          prevScale;
        page.transform.translate.y -=
          ((touch.clientY -
            rect.top -
            rect.height / 2 -
            page.transform.translate.y) *
            scaleDiff) /
          prevScale;

        applyTransform();

        prevTap = 0;
      }
    } else if (page.transform.scale < 1) {
      resetTranform();
    } else if (page.transform.scale > 1) {
      if (tapLength < 200 && distance < 50) {
        resetTranform();
        prevTap = 0;
      }
    }
  }

  if (e.touches.length === 1) {
    const touch = e.touches[0];
    start.x = touch.clientX - page.transform.translate.x;
    start.y = touch.clientY - page.transform.translate.y;
  }
});

document.addEventListener("mouseleave", () => {
  isDragging = false;
  resetTranform();
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
  resetTranform();
});

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft": {
      if (page.transform.scale !== 1) {
        page.transform.translate.x += 100;
        applyTransform();
      } else {
        prevPage();
      }
      break;
    }
    case "ArrowRight": {
      if (page.transform.scale !== 1) {
        page.transform.translate.x -= 100;
        applyTransform();
      } else {
        nextPage();
      }
      break;
    }
    case "ArrowUp": {
      if (page.transform.scale !== 1) {
        page.transform.translate.y += 100;
        applyTransform();
      }
      break;
    }
    case "ArrowDown": {
      if (page.transform.scale !== 1) {
        page.transform.translate.y -= 100;
        applyTransform();
      }
      break;
    }
    case "+": {
      page.transform.scale = Math.min(page.transform.scale + 0.25, 3);
      applyTransform();
      break;
    }
    case "-": {
      page.transform.scale = Math.max(page.transform.scale - 0.25, 0.5);
      applyTransform();
      break;
    }
    case "0":
      resetTranform();
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
