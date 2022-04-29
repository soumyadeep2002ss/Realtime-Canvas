import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './Canvas1.css';
import { HexColorPicker } from "react-colorful";
import { BsEraserFill } from "react-icons/bs";
import { BsFillPencilFill } from "react-icons/bs";
import { AiOutlineClear } from "react-icons/ai";
import { FaUndo } from "react-icons/fa";
import { FaRedo } from "react-icons/fa";

const Canvas = () => {
    const [storeImgData, setStoreImgData] = useState(['']);
    const [storeImgData1, setStoreImgData1] = useState(['']);
    // console.log(storeImgData);
    const [brushColor, setBrushColor] = useState("white");
    const [brushRadius, setBrushRadius] = useState(1);
    const { current: canvasDetails } = useRef({ color: 'white', socketUrl: '/', lineWidth: 1 });
    // const [undo, setUndo] = useState(0);
    // const [redo, setRedo] = useState(0);

    const changeColor = (newColor) => {
        setBrushColor(newColor);
        canvasDetails.color = brushColor;
        // console.log(canvasDetails.color);
    }
    const changeBrushSize = (newBrushSize) => {
        canvasDetails.socket.emit('setBrush');
        changeBrushRadius(newBrushSize);
        // setBrushRadius(newBrushSize);
        // setBrushColor(canvasDetails.color);
        // canvasDetails.lineWidth = brushRadius;
    }
    const eraser = () => {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        canvasDetails.lineWidth = 10;
        // context.globalCompositeOperation = 'destination-out';
        canvasDetails.color = "black";
    }
    const pen = () => {
        canvasDetails.lineWidth = brushRadius;
        canvasDetails.color = brushColor;
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        context.globalCompositeOperation = 'source-over';
    }
    const clear = () => {
        canvasDetails.socket.emit('clear');
        clearCanvas();
    }

    function clearCanvas() {
        canvasDetails.socket.emit('canvasUndo');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    const undo = () => {
        // canvasDetails.socket.emit('canvasUndo');
        canvasUndo();
    }

    function canvasUndo() {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        // console.log(storeImgData.length);
        storeImgData.pop();
        canvasDetails.socket.emit('undo-photo', ({ photoData: storeImgData }))
        // console.log(storeImgData.length);
        const image = new Image();
        image.src = storeImgData[storeImgData.length - 1];
        // context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
    }

    const redo = () => {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        const image = new Image();
        storeImgData1.pop();
        // console.log(storeImgData);
        image.src = storeImgData[storeImgData.length - 1];
        // console.log(storeImgData[storeImgData.length - 1]);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
    }





    function changeBrushRadius(newBrushSize) {
        setBrushRadius(newBrushSize);
        // setBrushColor(canvasDetails.color);
        canvasDetails.lineWidth = brushRadius;
        // canvasDetails.socket.emit('setBrush');
    }

    useEffect(() => {

        canvasDetails.socketUrl = 'http://localhost:5000';
        canvasDetails.socket = io.connect(canvasDetails.socketUrl, () => {
            // console.log('connecting to server')
        })
        canvasDetails.socket.on('image-data', (data) => {
            const image = new Image()
            const canvas = document.getElementById('canvas');
            const context = canvas.getContext('2d');
            image.src = data;
            image.addEventListener('load', () => {
                context.drawImage(image, 0, 0);
            });
        })
        canvasDetails.socket.on('undo-data', ({ undoData }) => {
            const canvas = document.getElementById('canvas');
            const context = canvas.getContext('2d');
            const image = new Image();
            image.src = undoData[undoData.length - 1];
            console.log(storeImgData[storeImgData.length - 1]);
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0);
            // setStoreImgData(undoData);
        })
        canvasDetails.socket.on('clear', clearCanvas);
        // canvasDetails.socket.on('canvasUndo', canvasUndo);

    }, []);

    useEffect(() => {
        const mouseMoveHandler = (e, type) => {
            const event = type === 'touch' ? e.touches[0] : e;
            findxy('move', event)
        }
        const mouseDownHandler = (e, type) => {
            const event = type === 'touch' ? e.touches[0] : e;
            findxy('down', event);
        }
        const mouseUpHandler = (e, type) => {
            const event = type === 'touch' ? e.touches[0] : e;
            findxy('up', event)
        }

        let prevX = 0, currX = 0, prevY = 0, currY = 0, flag = false;

        const canvas = document.getElementById('canvas');
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        const context = canvas.getContext('2d');
        const onSave = () => {
            if (!canvasDetails.waiting) {
                const base64EncodedUrl = canvas.toDataURL('image/png');
                // addToImgData(base64EncodedUrl);
                storeImgData.push(base64EncodedUrl);
                storeImgData1.push(base64EncodedUrl);
                canvasDetails.socket.emit('image-data', base64EncodedUrl);
                canvasDetails.waiting = true;
                setTimeout(() => {
                    canvasDetails.waiting = false;
                }, 100);
            }
        }

        const draw = (e) => {

            // START- DRAW
            context.beginPath();
            context.moveTo(prevX, prevY);
            context.lineTo(currX, currY);
            context.strokeStyle = canvasDetails.color;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = canvasDetails.lineWidth;
            context.stroke();
            context.closePath();
            // END- DRAW

            onSave();
        }

        const findxy = (res, e) => {
            if (res === 'down') {
                prevX = currX;
                prevY = currY;
                currX = e.clientX - canvas.offsetLeft;
                currY = e.clientY - canvas.offsetTop;
                flag = true;
            }
            if (res === 'up' || res === "out") {
                flag = false;
            }
            if (res === 'move') {
                if (flag) {
                    prevX = currX;
                    prevY = currY;
                    currX = e.clientX - canvas.offsetLeft;
                    currY = e.clientY - canvas.offsetTop;
                    draw(e);
                }
            }
        }

        canvas.addEventListener("mousemove", mouseMoveHandler);
        canvas.addEventListener("mousedown", mouseDownHandler);
        canvas.addEventListener("mouseup", mouseUpHandler);
        canvas.addEventListener("touchmove", (e) => mouseMoveHandler(e, 'touch'), { passive: true });
        canvas.addEventListener("touchstart", (e) => mouseDownHandler(e, 'touch'), { passive: true });
        canvas.addEventListener("touchend", (e) => mouseUpHandler(e, 'touch'));
        canvas.addEventListener("dblclick", onSave);

        return () => {
            canvas.removeEventListener("mousemove", mouseMoveHandler);
            canvas.removeEventListener("mousedown", mouseDownHandler);
            canvas.removeEventListener("mouseup", mouseUpHandler);
            canvas.removeEventListener("dblclick", onSave);
        }
    }, [])

    return (
        <>
            <div className='blackboard'>
                <figure className="frame">
                    <div className='color-picker-wrapper'>
                        <input
                            className='color-picker'
                            type='color'
                            defaultValue='#EFEFEF'
                            onChange={(e) => changeColor(e.target.value)}
                        />
                        <input
                            min="2"
                            max="50"
                            type="range"
                            value={brushRadius}
                            onChange={(event) => {
                                changeBrushSize(parseInt(event.target.value));
                            }}
                        />
                        <span>{brushRadius}</span>
                    </div>
                    <canvas className='canvas' id='canvas'></canvas>
                </figure>
                <div className='button-wrapper'>
                    <button className="btn"
                        onClick={(e) => {
                            eraser()
                        }}><BsEraserFill size={14} /></button>
                    <button className="btn"
                        onClick={(e) => {
                            pen()
                        }}><BsFillPencilFill size={14} /></button>
                    <button className="btn"
                        onClick={(e) => {
                            clear()
                        }}><AiOutlineClear size={14} /></button>
                    <button className="btn"
                        onClick={(e) => {
                            undo()
                        }}><FaUndo size={14} /></button>
                    {/* <button className="btn"
                        onClick={(e) => {
                            redo()
                        }}><FaRedo size={14} /></button> */}
                </div>
            </div>
        </>
    )

}

export default Canvas