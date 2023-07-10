import type { Application } from "./Application";
import type { Script, TableData, PasteBuffer, Cells } from "./Types";
import { ActionArea } from "./Crawler";


export class Table {

    cells: Cells
    script: Script
    theme: string
    pasteBuffer: PasteBuffer
    variables: object
    action_areas: { [key: string]: ActionArea }

    constructor(public app: Application, data?: TableData) {
        if (data !== undefined) {
            this.variables = data['variables'];
            this.cells = data['cells'];
            this.script = data['script'];
            this.theme = data['theme'];
            this.action_areas = {};
        } else {
            this.cells = {};
            this.action_areas = {};
            this.script = {'committed_code': '', 'temporary_code': ''};
            this.theme = 'dark';
            this.variables = {};
        }
        this.pasteBuffer = {};
    }

    createActionArea = (x: number, y: number, x_size: number, y_size: number) => {

        function _generateId(x: number, y: number, x_size: number, y_size: number) {
            return `${x},${y},${x_size},${y_size}`;
        }

        // Check if action_ares already exists at this location
        if (!this.action_areas.hasOwnProperty(_generateId(x,y,x_size,y_size))) {
            let area = new ActionArea(this, x, y, x_size, y_size);
            this.action_areas[_generateId(x,y,x_size,y_size)] = area;
        }
    }

    resetPasteBuffer = () => this.pasteBuffer = {}

    public get data():object {
        return {
            'cells': this.cells,
            'paste_buffer': this.pasteBuffer,
            'script': this.script,
            'theme': this.theme
        }
    }

    addCell = (x: number, y: number, char: string) => {
        let id = this.generateID(x, y)
        this.cells[id] = char;
    }

    clear = () => this.cells = {}

    generateID = (x: number, y: number) => `${x},${y}`

    exists = (id: string) => this.cells.hasOwnProperty(id)

    existsAt = (x: number, y: number) => this.exists(this.generateID(x, y))

    getCell = (x: number, y: number) => {
        let id = this.generateID(x, y);
        if (!this.exists(id)) {
            return '';
        } else {
            return this.cells[id];
        }
    }

    removeCell = (x: number, y: number) => {
        let id = this.generateID(x, y);
        if (this.exists(id)) {
            delete this.cells[id];
        }
    }

    paste = () => {

        // Update pasteBuffer
        this.pasteBuffer = this.pasteBufferFromClipboard();

        let { x, y } = this.app.context.cursor;
        let { x_size , y_size } = this.app.context.cursor.size;
        for (let i = 0; i < y_size ; i++) {
            for (let j = 0; j < x_size ; j++) {
                let id = this.generateID(i, j);
                if (this.pasteBuffer.hasOwnProperty(id) && this.pasteBuffer[id] !== '') {
                    this.addCell(x + j, y + i, this.pasteBuffer[id]);
                }
            }
        }
    }

    pasteBufferFromClipboard = (): PasteBuffer => {
        // Get paste string from interface
        let pasteString = this.app.interface?.pasteFromClipboard;

        // If pasteString is empty, return original paste buffer
        if (pasteString === undefined || pasteString === '')  
        { 
            return this.pasteBuffer;
        }
        else {
            pasteString = this.app.interface?.pasteFromClipboard;
        }

        // Create new buffer
        let pasteBuffer = {};

        // Split string into lines
        pasteString = pasteString as string;
        let lines = pasteString?.split('\n');
        // Get largest line length
        let x_size = Math.max(...lines.map(line => line.length));
        let y_size = lines.length;
        // Set cursor size to the size of the paste
        this.app.context.cursor.setSize(x_size, y_size);
        this.resetPasteBuffer();
        for (let i = 0; i < y_size ; i++) {
            for (let j = 0; j < x_size ; j++) {
                // If lines[i][j] is undefined, empty string or space, don't add to paste buffer
                if(lines[i][j]) {
                    if (lines[i][j] !== undefined || lines[i][j] !== '' || lines[i][j] !== ' ') {
                        let id = this.generateID(i, j);
                        pasteBuffer[id] = lines[i][j];
                    }
                }
            }
        }
        return pasteBuffer;
    }

    removeZone = (x: number, y: number, x_size: number, y_size: number) => {
        for (let i = 0; i < y_size ; i++) {
            for (let j = 0; j < x_size ; j++) {
                this.removeCell(x + i, y + j);
            }
        }
    }

    copyUnderCursor = () => {
        let { x, y } = this.app.context.cursor;
        let { x_size , y_size } = this.app.context.cursor.size;
        let string = '';
        for (let i = 0; i < y_size ; i++) {
            for (let j = 0; j < x_size ; j++) {
                let cellString = this.getCell(x + j, y + i);
                string += cellString=='' ? ' ' : cellString;
            }

            if (i < y_size - 1) string += '\n';
        }
        this.pasteToClipboard(string);
    }

    pasteBufferToString = () => {
        let string = '';
        for(let key in this.pasteBuffer) {
            string += this.pasteBuffer[key]=='' ? ' ' : this.pasteBuffer[key];
        }
        return string;
    }

    pasteToClipboard = (pasteString: string) => {
        navigator.clipboard.writeText(pasteString);
        this.app.interface?.setPasteFromBrowser(pasteString);
    }

}