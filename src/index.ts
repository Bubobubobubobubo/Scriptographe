import { Application } from './Application.js';
import type { SavedContext } from './Types.js';

const FPS: number = 30;
const FPS_INTERVAL: number = 1000 / FPS;

let application: Application = new Application('text');
let cursor: HTMLElement = document.getElementById("cursor") as HTMLElement;
let universe: HTMLElement = document.getElementById("universe") as HTMLElement;
let play_button: HTMLElement = document.getElementById("play") as HTMLElement; 
let zone: HTMLElement = document.getElementById("zone") as HTMLElement;
let clock: HTMLElement = document.getElementById("clock") as HTMLElement;

play_button.addEventListener("click", () => {
    if (!application.running) {
    application.startAudioContext();
    play_button.textContent = "⏸";
    } else {
    play_button.textContent = "⏵";
    application.audio_context.suspend();
    }
    application.running= !application;
}); 

window.onresize = () => {
    if (application.interface) application.interface.resizeGrid();
}

window.onbeforeunload = function(): null {
    let saved_context: SavedContext = application.save();
    localStorage.setItem('context', JSON.stringify(saved_context));
    return null;
}

function loop(time: DOMHighResTimeStamp) {
    if(application.redraw) {
        cursor.textContent = application.context.cursor.toString();
        universe.textContent = `${application.context.current_table}`;
        const newContent = application.process();
        if (newContent) zone.replaceChildren(newContent);
    }
    // The clock should always move
    clock.textContent = application.clock.toString();

    window.requestAnimationFrame(loop);

}

// First frame
loop()