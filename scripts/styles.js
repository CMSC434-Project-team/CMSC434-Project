import * as shared from "./_global.js";
// Run check: node --check scripts/styles.js

console.log("styles.js loaded");

// Draggable square for measurements ====================
const square = document.getElementById('draggable-square');

let isDragging = false;
let offsetX, offsetY;

function startDrag(clientX, clientY) {
	isDragging = true;
	offsetX = clientX - square.getBoundingClientRect().left;
	offsetY = clientY - square.getBoundingClientRect().top;
	square.style.cursor = 'grabbing';
}

square.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));

square.addEventListener('touchstart', (e) => {
	// Prevents scrolling the page while dragging the square
	e.preventDefault();
	const touch = e.touches[0];
	startDrag(touch.clientX, touch.clientY);
}, { passive: false }); // { passive: false } allows e.preventDefault() to work


function moveDrag(clientX, clientY) {
	if (!isDragging) return;
	const x = clientX - offsetX;
	const y = clientY - offsetY;

	square.style.left = `${x}px`;
	square.style.top = `${y}px`;
}

document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));

document.addEventListener('touchmove', (e) => {
	if (!isDragging) return;
	const touch = e.touches[0];
	moveDrag(touch.clientX, touch.clientY);
}, { passive: false });

function endDrag() {
	if (isDragging) {
		isDragging = false;
		square.style.cursor = 'grab';
	}
}

document.addEventListener('mouseup', endDrag);
document.addEventListener('touchend', endDrag);
document.addEventListener('touchcancel', endDrag); // Handles interruptions like incoming calls
