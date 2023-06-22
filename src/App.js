import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";
let cont = 0

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);

  const addMoveable = async () => {
    let id;
    (moveableComponents.length == 0)
      ? id = 0
      : id = moveableComponents[moveableComponents.length - 1].id + 1
    // Create a new moveable component and add it to the array

    const response = await fetch("https://jsonplaceholder.typicode.com/photos/" + (id + 1));
    const jsonData = await response.json();
    const url = jsonData.url

    setMoveableComponents([
      ...moveableComponents,
      {
        id: id,
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        updateEnd: true,
        color: `url("${url}")`,
        backgroundSize: 'cover',
      },
    ]);
  };

  const updateMoveable = (id, newComponent, updateEnd = false) => {
    const updatedMoveables = moveableComponents.map((moveable, i) => {
      if (moveable.id === id) {
        return { id, ...newComponent, updateEnd };
      }
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  const handleResizeStart = (e, nodoReferencia, parent) => {
    let newWidth = e.width
    let newHeight = e.height
    // Check if the resize is coming from the left handle
    const [handlePosX, handlePosY] = e.direction;
    // 0 => center
    // -1 => top or left
    // 1 => bottom or right

    // -1, -1 left top
    // -1, 0  left center
    // -1, 1  left bottom
    // handle top
    if (handlePosY === -1) {

      if (nodoReferencia.top <= 0) {
        newHeight = nodoReferencia.height
      }

    }
    //handle left
    if (handlePosX === -1) {

      if (nodoReferencia.left <= 0) {
        newWidth = nodoReferencia.width
      }

    }
    //handle right
    /* if (handlePosX === 1) {
      console.log("handleposx = 1", nodoReferencia)
      const rightBorder = newWidth + nodoReferencia.left

      console.log(rightBorder)

      
    } */
    return { newWidth, newHeight }
  };

  const handleDelete = (index) => {
    moveableComponents.splice(index, 1)
    setMoveableComponents([...moveableComponents])
  }

  return (
    <main style={{ height: "100vh", width: "100vw" }}>
      <button onClick={addMoveable}>Add Moveable1</button>

      {moveableComponents.map((item, index) => (

        <button
          key={index}
          style={{ background: `${moveableComponents[index].color}` }}
          onClick={() => { handleDelete(index) }}
        >
          Eliminar</button>
      ))}
      <div
        id="parent"
        style={{
          position: "relative",
          background: "black",
          height: "80vh",
          width: "80vw",
        }}
      >
        {moveableComponents.map((item, index) => (
          <Component
            {...item}
            key={index}
            updateMoveable={updateMoveable}
            handleResizeStart={handleResizeStart}
            setSelected={setSelected}
            isSelected={selected === item.id}
          />
        ))}
      </div>
    </main>
  );
};

export default App;

// Component that moves
const Component = ({
  updateMoveable,
  handleResizeStart,
  top,
  left,
  width,
  height,
  index,
  color,
  id,
  setSelected,
  isSelected = false,
  updateEnd,
}) => {
  const ref = useRef();

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    color,
    id,
    translateX: 0,
    translateY: 0,
  });

  let parent = document.getElementById("parent");
  let parentBounds = parent?.getBoundingClientRect();

  const handleOnDrag = async (e) => {
    let newTop = e.top
    let newLeft = e.left

    //The translate doesn't let to show the real position of the component so you have to calc it using nodoReferencia to adjust to the traslate
    if (newLeft < 0 - nodoReferencia.translateX) newLeft = -nodoReferencia.translateX
    if (e.right - nodoReferencia.translateX < 0) newLeft = newLeft + e.right - nodoReferencia.translateX
    if (e.top < 0 - nodoReferencia.translateY) newTop = -nodoReferencia.translateY
    if (e.bottom - nodoReferencia.translateY < 0) newTop = newTop + e.bottom - nodoReferencia.translateY

    updateMoveable(id, {
      top: newTop,
      left: newLeft,
      width,
      height,
      color,
    });
  }


  const onResize = async (e) => {
    // ACTUALIZAR ALTO Y ANCHO
    let { newWidth, newHeight } = handleResizeStart(e, nodoReferencia, parentBounds)

    const positionMaxTop = nodoReferencia.top + newHeight;
    const positionMaxLeft = nodoReferencia.left + newWidth;

    if (positionMaxTop > parentBounds?.height) {
      newHeight = parentBounds?.height - nodoReferencia.top;
    }
    if (positionMaxLeft > parentBounds?.width) {
      newWidth = parentBounds?.width - nodoReferencia.left;
    }

    updateMoveable(id, {
      top,
      left,
      width: newWidth,
      height: newHeight,
      color,
    });

    // ACTUALIZAR NODO REFERENCIA
    const beforeTranslate = e.drag.beforeTranslate;

    ref.current.style.width = `${newWidth}px`;
    ref.current.style.height = `${newHeight}px`;

    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;
    ref.current.datas = '${translateX}px, ${translateY}px'

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      height: newHeight,
      width: newWidth,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  const onResizeEnd = async (e) => {
    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = nodoReferencia.top + newHeight;
    const positionMaxLeft = nodoReferencia.left + newWidth;


    if (positionMaxTop > parentBounds?.height) {
      newHeight = parentBounds?.height - nodoReferencia.top;
    }
    if (positionMaxLeft > parentBounds?.width) {
      newWidth = parentBounds?.width - nodoReferencia.left;
    }

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    //AbsoluteTOP and absoluteLeft are unneserary 
    const absoluteTop = top + beforeTranslate[1];
    const absoluteLeft = left + beforeTranslate[0];

    updateMoveable(
      id,
      {
        top: top,
        left: left,
        width: newWidth,
        height: newHeight,
        color,
      },
      true
    );
  };

  return (
    <>
      <div
        ref={ref}
        className="draggable"
        id={"component-" + id}
        style={{
          position: "absolute",
          top: top,
          left: left,
          width: width,
          height: height,
          background: color,
        }}
        onClick={() => setSelected(id)}
      />

      <Moveable
        target={isSelected && ref.current}
        resizable
        draggable
        onDrag={handleOnDrag}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
      >
      </Moveable>
    </>
  );
};