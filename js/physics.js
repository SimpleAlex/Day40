(function () {

  const canvas = document.getElementsByClassName('canvas')[0],
        c = canvas.getContext('2d');


  // -----------------------------------
  // Resize the canvas to be full screen
  // -----------------------------------

  window.addEventListener('resize', resizeCanvas, false);

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // ---------
    // Variables
    // ---------

    var circleRadius = 60,
        circleHeight = circleRadius * 2,
        x = (canvas.width/2) - circleRadius, // inital x position of the ball
        y = (canvas.height/2) - circleRadius, // inital y position of the ball
        vx = 0, // velocity
        vy = 0, // velocity
        groundHeight = circleHeight,
        absoluteBottom = canvas.height - groundHeight/2 - circleRadius*2,
        bounceValues = [],
        bouncePeak = 0,
        bounceStop = false,
        distanceFallen = 1,
        squishTimeInitial = 8, // How long the squish will take to complete
        squishMax = 60, // How much should the object squish when thrown from the max height
        squishFactor = squishMax/squishTimeInitial,
        squishTime = squishTimeInitial,
        gravity = 0.6,
        dampening = 0.5,
        pullStrength = 0.05,
        segments = 4,
        bezieCircleFormula = (4/3)*Math.tan(Math.PI/(2*segments)), // http://stackoverflow.com/a/27863181/2040509
        pointOffset = {
          positive: bezieCircleFormula*circleRadius,
          negative: circleRadius-(bezieCircleFormula*circleRadius)
        },
        // Each side has 3 points, bezier 1, circle point, bezier 2
        // These are listed below in clockwise order.
        // So top has: left bezier, circle point, right bezier
        // Right has: top bezier, circle point, bottom bezier
        circlePoints = {
          top: [
            [x+pointOffset.negative, y],
            [x+circleRadius, y],
            [x+pointOffset.positive+circleRadius, y]
          ],
          right: [
            [x+circleHeight, y+pointOffset.negative],
            [x+circleHeight, y+circleRadius],
            [x+circleHeight, y+pointOffset.positive+circleRadius]
          ],
          bottom: [
            [x+pointOffset.positive+circleRadius, y+circleHeight],
            [x+circleRadius, y+circleHeight],
            [x+pointOffset.negative, y+circleHeight]
          ],
          left: [
            [x, y+pointOffset.positive+circleRadius],
            [x, y+circleRadius],
            [x, y+pointOffset.negative]
          ]
        };



    // --------------------
    // Ball squish function
    // --------------------
    // For `side` you can pass `top`, `right`, `bottom`, `left`
    // For `amount` use an interger

    function squish (side, squishAmount) {
      for (var i = 0; i < circlePoints[side].length; i++) {
        if (side === 'top') {
          circlePoints[side][i][1] += squishAmount;
        } else if (side === 'right') {
          circlePoints[side][i][0] -= squishAmount;
        } else if (side === 'bottom') {
          circlePoints[side][i][1] -= squishAmount;
        } else if (side === 'left') {
          circlePoints[side][i][0] += squishAmount;
        }
      }
    }



    // ------------------
    // Animation Function
    // ------------------

    function render () {

      // Clear the canvas
      c.clearRect(0, 0, canvas.width, canvas.height);



      // -----------------
      // Draw the elements
      // -----------------

      // Ground
      c.beginPath();
      c.fillStyle = '#1b611c';
      c.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
      c.closePath();

      // Shadow
      var distanceFromGround = parseFloat(((y - canvas.height/2) + circleHeight) / (canvas.height/2 - groundHeight/2)).toFixed(4),
          shadowWidth = circleRadius * (1-distanceFromGround+1),
          shadowHeight = circleRadius/6 * (1-distanceFromGround+1),
          shadowX = (x + circleRadius) - shadowWidth/2,
          shadowY = canvas.height - groundHeight/2,
          shadowOpacity = 0.15 * distanceFromGround; // The first value here represents the opacity that will be used when the ball is touching the ground

      c.beginPath();
      c.fillStyle = 'rgba(0,0,0, ' + shadowOpacity + ')';
      c.moveTo(shadowX, shadowY);
      c.bezierCurveTo(shadowX, shadowY - shadowHeight, shadowX + shadowWidth, shadowY - shadowHeight, shadowX + shadowWidth, shadowY);
      c.bezierCurveTo(shadowX + shadowWidth, shadowY + shadowHeight, shadowX, shadowY + shadowHeight, shadowX, shadowY);
      c.fill();
      c.closePath();

      // Bezier circle
      c.beginPath();
      c.fillStyle = '#ff3366';
      c.moveTo(circlePoints.left[1][0], circlePoints.left[1][1]);
      c.bezierCurveTo(circlePoints.left[2][0], circlePoints.left[2][1], circlePoints.top[0][0], circlePoints.top[0][1], circlePoints.top[1][0], circlePoints.top[1][1]);
      c.bezierCurveTo(circlePoints.top[2][0], circlePoints.top[2][1], circlePoints.right[0][0], circlePoints.right[0][1], circlePoints.right[1][0], circlePoints.right[1][1]);
      c.bezierCurveTo(circlePoints.right[2][0], circlePoints.right[2][1], circlePoints.bottom[0][0], circlePoints.bottom[0][1], circlePoints.bottom[1][0], circlePoints.bottom[1][1]);
      c.bezierCurveTo(circlePoints.bottom[2][0], circlePoints.bottom[2][1], circlePoints.left[0][0], circlePoints.left[0][1], circlePoints.left[1][0], circlePoints.left[1][1]);
      c.fill();
      c.closePath();



      // -------------------------------
      // Recalculate circle co-ordinates
      // -------------------------------

      circlePoints = {
        top: [
          [x+pointOffset.negative, y],
          [x+circleRadius, y],
          [x+pointOffset.positive+circleRadius, y]
        ],
        right: [
          [x+circleHeight, y+pointOffset.negative],
          [x+circleHeight, y+circleRadius],
          [x+circleHeight, y+pointOffset.positive+circleRadius]
        ],
        bottom: [
          [x+pointOffset.positive+circleRadius, y+circleHeight],
          [x+circleRadius, y+circleHeight],
          [x+pointOffset.negative, y+circleHeight]
        ],
        left: [
          [x, y+pointOffset.positive+circleRadius],
          [x, y+circleRadius],
          [x, y+pointOffset.negative]
        ]
      };



      // -----------------
      // Animation Gravity
      // -----------------


      if (bounceStop === false) {
        // Increment gravity
        vy += gravity;

        // Increment velocity
        y += vy;
        x += vx;
      }



      // ----------
      // Boundaries
      // ----------

      bounceValues.push(y);

      // Bottom boundary
      if (y + circleHeight >= canvas.height - groundHeight/2) {

        if (bounceStop !== true) {
          y = canvas.height - groundHeight/2 - circleHeight;

          // ---------------
          // Distance Fallen
          // ---------------

          bouncePeak = Math.min.apply(Math, bounceValues);

          if (bouncePeak < 0) {
            bouncePeak = 0;
          }

          if (bouncePeak <= absoluteBottom) {

            distanceFallen = 1-(Math.round(bouncePeak/(canvas.height - groundHeight/2 - circleHeight)*100)/100);

            squishFactor = Math.round(squishMax * distanceFallen)/squishTimeInitial;

            if (squishFactor > 0.5) {
              distanceFallen = 1;
              squishFactor = Math.round(squishMax * distanceFallen)/squishTimeInitial;
            } else {
              distanceFallen += 0.3;
              squishFactor = Math.round(squishMax * distanceFallen)/squishTimeInitial;
            }

            // Reset the peak array once the ball has hit an edge
            bounceValues = [];
          }
        }

        // Stop the bouncing and perform squish
        if (squishTime > 0) {

          // Stop the bouncing
          bounceStop = true;

          // Divide the squish into two parts
          if (squishTime > squishTimeInitial/2) {

            // Squish
            squish ('bottom', ((squishTimeInitial-squishTime)*squishFactor));
            y += squishFactor;

          } else {

            // Unsquish
            squish ('bottom', squishTime*squishFactor);
            y -= squishFactor;

          }

          squishTime--;
        } else {

          // Resume the bouncing
          bounceStop = false;
          squishTime = squishTimeInitial;

          vy *= -1;

          // Dampening
          vy *= dampening;
          vx *= dampening;

          // If the Y velocity is less than the value below, stop the ball
          if (vy > -3.2) {
            dampening = 0;
            squishTime = 0;
          }
        }
      }

      // Right boundary
      if (x + circleHeight > canvas.width) {
        x = canvas.width - circleHeight;
        vx *= -1;

        // Dampening
        vy *= dampening;
        vx *= dampening;
      }

      // Left boundary
      if (x + circleHeight < 0 + circleHeight) {
        x = 0;
        vx *= -1;

        // Dampening
        vy *= dampening;
        vx *= dampening;
      }

      // Top boundary
      if (y < 0) {
        y = 0;
        vy *= -1;

        // Dampening
        vy *= dampening;
        vx *= dampening;
      }

      requestAnimationFrame(render);
    }



    // -----------
    // Click event
    // -----------

    canvas.addEventListener('mousedown', function (e) {
      var dx = e.pageX - x,
          dy = e.pageY - y;

      if (dampening === 0) {
        dampening = 0.5;
        squishTime = squishTimeInitial;
      }

      vx += dx * pullStrength;
      vy += dy * pullStrength;

    });

    render();

  }
  resizeCanvas();
})();
