const container = document.querySelector(".container");

container.innerHTML = chapters
  .map(
    (ch, i) => `
	<a href="ch/${i + 1}">
		<div class="chapter">
			<img src="${ch.cover}" width="100%">
			<p>${ch.title}<p>
		</div>
	</a>
  `,
  )
  .join("");
