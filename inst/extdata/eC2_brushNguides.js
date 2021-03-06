// exCon2 Bryan Hanson, DePauw University, June 2015
// Based on exCon by Kristina Mulry & Bryan Hanson

// Brush related functions

var activateBrush = function() {
		// IMPORTANT: xD & yD are global variables

		var brush, x0, y0, x1, y1, brushed

		function brushed() { // Handles the response to brushing

			var br, coords, minX, maxX, minY, maxY, x0, x1, y0, y1, xL, xU, yL, yU, spanX, spanY

			if (!d3.event.selection) return; // handles single click to clear brush

			br = document.getElementById("BRUSH")
			coords = d3.brushSelection(br)
			// In d3 v4 the coordinates returned are screen pixels
			minX = coords[0][0]
			maxX = coords[1][0]
			minY = coords[0][1]
			maxY = coords[1][1]
			x0 = lPad + conWidth + gap // dim of map region
			y0 = tPad
			x1 = x0 + mapWidth
			y1 = y0 + mapHeight
			xL = ((minX - x0) / (x1 - x0)) // as a frac of map region
			xU = ((maxX - x0) / (x1 - x0))
			yL = ((minY - y0) / (y1 - y0))
			yU = ((maxY - y0) / (y1 - y0))
			spanX = Dx[1] - Dx[0]
			spanY = Dy[1] - Dy[0]
			// update global values
			xD = [((spanX * xL) + Dx[0]), ((spanX * xU) + Dx[0])]
			// yD is more complex since the reference point is the top of the screen
			yD = [(spanY * (1 - yU) + Dy[0]), (spanY * (1 - yL) + Dy[0])]
			// save the extent in fraction units, needed by
			// the row counter in getRowIndex
			// reference point 0,0 is lower left
			brushExtent = [xL, xU, 1 - yU, 1 - yL] // global variable
			clearContour();
			drawContour(xD, yD);
			} // end of brushed

		// The following sets up and positions the brush

	  brush = d3.brush()
	  x0 = lPad + conWidth + gap // dim of map region
	  y0 = tPad
	  x1 = x0 + mapWidth
	  y1 = y0 + mapHeight
	  brush.extent([[x0, y0],[x1, y1]])
	    .on("end", brushed) // carry out the zoom
	    .on("start", resetBrush) // single click resets view

	  svg.append("svg") // Appends the svg to include the brush
	  	.attr("class", "brush")
	    .attr("id", "BRUSH")
	    .call(brush)

	} // end of activateBrush

var resetBrush = function() {
	// reset global variables
	brushExtent = [0, 1, 0, 1]
	xD = Dx;
	yD = Dy;
	clearContour()
	drawContour(xD, yD)
}

// Guide related functions.  Note that these need to
// respond to brushing, which changes xD and yD

var activateGuides = function() {

		// Controls the guides (cursor) in the contour area

		// IMPORTANT: xD, yD, xM, yM are global variables

		var getMouseXY = function() {
				// get the mouse coordinates & report in terms of [0...1]
				var mouse = d3.mouse(document.getElementById("CON"));
				mX = mouse[0]; // in pixels
				mY = mouse[1];
				if (mX < 0) {
					mX = 0
				}; // truncate low
				if (mY < 0) {
					mY = 0
				};
				if (mX > conWidth) {
					mX = conWidth
				}; // truncate high
				if (mY > conHeight) {
					mY = conHeight
				};
				mX = mX / conWidth // as fraction
				mY = 1 - (mY / conHeight)
				followMouse(mX, mY);
				document.Show.mouseX.value = mX;
				document.Show.mouseY.value = mY;

				// Using 0.01 & 0.99 to avoid a silent rounding error
				// just as cursor moved out of contour area

				if (mY >= 0.01 || mY <= 0.99) {
					var row = getRowIndex(M, mY)
				}

				if (mX >= 0.01 || mX <= 0.99) {
					var col = getColIndex(M, mX)
				}

			} // end of getMouseXY

		var followMouse = function(mX, mY) { // This draws the guides, nothing else

				var xPos = (mX * conWidth) + lPad // mX now in pixels
				var yPos = tPad + conHeight - (mY * conHeight) // mY now in pixels

				var vertU = {
						x: xPos,
						y: tPad
					} // x, y at the top of window
					// x, y at the bottom of window:
				var vertL = {
					x: xPos,
					y: tPad + conHeight
				}
				var vEnds = [vertU, vertL];

				var horzU = {
						x: lPad,
						y: yPos
					} // x, y at the left side of window
					// x, y at the right side of window:
				var horzL = {
					x: lPad + conWidth,
					y: yPos
				}
				var hEnds = [horzU, horzL];

				d3.selectAll(".cursorGuide") // remove previous lines
					.remove();

				var line = d3.line()
					.x(function(d) {
						return d.x;
					})
					.y(function(d) {
						return d.y;
					})

				svg.append("path")
					.attr("class", "line")
					.attr("class", "cursorGuide")
					.attr("d", line(hEnds))

				svg.append("path")
					.attr("class", "line")
					.attr("class", "cursorGuide")
					.attr("d", line(vEnds))

			} // end of followMouse

		getMouseXY(xD, yD); // This starts it all off

	} // end of activateGuides


	var getColIndex = function(M, mX) {

			// Report the mouse position in native coordinates

			var xNat = xD[0] + ((mX) * (xD[1] - xD[0]))
			document.Show.mouseXnat.value = xNat

			// Report the mouse position as a column

			var nCol = arraySize(M)[1] // No. rows in the original matrix
				// Adjust no. cols to acct for brushing
			nColAdj = nCol * (brushExtent[1] - brushExtent[0])
			var xInd = nCol * brushExtent[0] + mX * nColAdj
			xInd = Math.round(xInd);
			document.Show.mouseCol.value = xInd;
			return (xInd);
		} // end of getColIndex


	var getRowIndex = function(M, mY) { // do we need to specify the args?

			// See getColIndex for more comments
			// IMPORTANT: reference point for brushing extent is lower left corner!
			var yNat = yD[0] + ((mY) * (yD[1] - yD[0]))
			document.Show.mouseYnat.value = yNat
			var nRow = arraySize(M)[0]
			var nRowAdj = nRow * (brushExtent[3] - brushExtent[2])
			var yInd = (mY * nRowAdj + nRow * brushExtent[2])
			yInd = Math.round(yInd);
			document.Show.mouseRow.value = yInd;
			return (yInd);
		} // end of getRowIndex

// Helper Function

	var arraySize = function(array) { // merged from several SO post ideas
		// js is row-major
		// assumes 2D array
		// assumes each row has the same length (= no. of columns)
		var nrows = array.length
		var ncols = array[0].length // length of first row
		return [nrows, ncols]
	}
