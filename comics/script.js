const container = document.querySelector(".container");

for (const c of data) {
	const link = document.createElement("a");
	link.href = c.slug;

	const div = document.createElement("div");
	div.className = "comic";

	const img = document.createElement("img");
	img.src = c.cover;
	img.style.width = "100%";

	const p = document.createElement("p");
	p.textContent = c.title;

	div.append(img, p);
	link.append(div);
	container.append(link);
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
