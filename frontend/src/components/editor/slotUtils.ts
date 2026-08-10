export function getSlotLabel(row: number, column: number): string {
  return `${getRowLabel(row)}${column + 1}`;
}

function getRowLabel(row: number): string {
  let value = row + 1;
  let label = '';

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}
