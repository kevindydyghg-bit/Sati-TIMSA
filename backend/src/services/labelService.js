const DPI = 203;
const CM_TO_DOTS = (cm) => Math.round(cm * DPI / 2.54);

const LABEL_W = CM_TO_DOTS(10.40);
const LABEL_H = CM_TO_DOTS(7.62);
const DEFAULT_FONT = 'A0N';

function generateInventoryLabel({ inventory_id, item_type, serial_number }) {
  return `^XA
^LL${LABEL_H}
^PW${LABEL_W}
^FO${CM_TO_DOTS(0.3)},${CM_TO_DOTS(0.3)}^A${DEFAULT_FONT},28,28^FDTIMSA^FS
^FO${CM_TO_DOTS(0.3)},${CM_TO_DOTS(0.3)}^A${DEFAULT_FONT},28,28^FB${CM_TO_DOTS(9.5)},1,0,1^FDID: ${inventory_id}^FS
^FO${CM_TO_DOTS(0.3)},${CM_TO_DOTS(0.9)}^A${DEFAULT_FONT},36,36^FB${CM_TO_DOTS(9.8)},1,0,2^FD${item_type}^FS
^FO${CM_TO_DOTS(0.5)},${CM_TO_DOTS(1.6)}^BCN,250,Y,N,N^FD>;${inventory_id}^FS
^FO${CM_TO_DOTS(0.3)},${CM_TO_DOTS(5.3)}^A${DEFAULT_FONT},28,28^FB${CM_TO_DOTS(9.8)},1,0,2^FD${serial_number}^FS
^FO${CM_TO_DOTS(0.3)},${CM_TO_DOTS(7.0)}^A${DEFAULT_FONT},20,20^FDPropiedad de TIMSA^FS
^XZ`;
}

module.exports = { generateInventoryLabel };
