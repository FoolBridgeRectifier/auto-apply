export const overlayDivStyle = {
  id: '__autofill-overlay',
  style: ` 
    position: fixed;
    top: 12px;
    right: 114px;
    z-index: 999999;
    background: #ffe4e1;
    border: 4px solid #808080;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  `,
};

export const toggleButtonStyle = {
  id: '__autofill-toggle-button',
  textContent: {
    pause: '⏸',
    play: '▶',
  },
  style: ` 
    margin: 5px;
    padding: 5px;
    color: black;
    font-family: math;
    font-weight: 800;
    background-color: inherit;
    border: 0;
    cursor: inherit;
  `,
};

export const clickFillButtonStyle = {
  id: '__autofill-click-button',
  textContent: 'Autofill',
  style: ` 
    margin: 5px;
    padding: 5px;
    color: black;
    font-family: monospace;
    font-weight: 600;
    background-color: inherit;
    border: 0;
    cursor: inherit;
  `,
};

export const counterStyle = {
  id: '__autofill-counter',
  style: `
    position: fixed;
    height: 82px;
    width: 77px;
    display: grid;
    grid-template-rows: 1fr 1fr 1fr;
    gap: 4px;
    place-items: center;
    font-size: 13px;
    top: 12px;
    right: 8px;
    z-index: 999999;
    background: #ffe4e1;
    border: 4px solid #808080;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    color: black;
    font-family: monospace;
    font-weight: 600;
  `,
};
