function changeSvgColor(svgText: string, hexcolor: string) {
  return svgText.replace(/<path /, `<path fill="${hexcolor}" `);
}

function changeSvgSize(svgText: string, size: number) {
  // Replace width and height if present
  let updated = svgText
    .replace(/(width=")[^"]*(")/, `$1${size}$2`)
    .replace(/(height=")[^"]*(")/, `$1${size}$2`);

  // If width is missing, add it after <svg
  if (!/width="/.test(updated)) {
    updated = updated.replace(/<svg([^>]*)/, `<svg$1 width="${size}"`);
  }
  // If height is missing, add it after <svg
  if (!/height="/.test(updated)) {
    updated = updated.replace(/<svg([^>]*)/, `<svg$1 height="${size}"`);
  }

  return updated;
}

export { changeSvgColor, changeSvgSize }
