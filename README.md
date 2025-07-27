# hw06-graphics-basketball
Spring Semester 2025 – Computer Graphics

## Student Information
Name: Maayan Wote

## 🚀 How to Run the Project
1. Make sure all project files (including `hw5.js`, `OrbitControls.js`, and `index.html`) are in the same folder.
2. Open the `index.html` file in a modern browser (preferably Google Chrome).
3. Play the interactive basketball shooting game with physics and full scoring!

## Controls
Arrow keys (← → ↑ ↓) – Move the basketball horizontally and forward/backward on the court  
W / S – Increase or decrease the shot power  
Spacebar – Shoot the basketball  
R – Reset the ball to center court and reset power  
T – Start a 60-second time challenge mode  
O – Toggle orbit camera mode

## Physics System Explanation

**Gravity and Trajectory:**  
The basketball is affected by constant downward gravity.  
When the player shoots the ball, it launches with an initial velocity based on power and direction, forming a parabolic arc.

**Collision and Bouncing:**  
The ball bounces when hitting the ground, with reduced energy after each bounce.  
It eventually comes to rest after several bounces.  
There is also basic boundary detection to keep the ball on the court.

**Shot Detection:**  
A shot is counted as successful only when the ball enters the hoop area from above and passes through the center.  
Each successful shot awards 2 points.

## Bonus Features

**Time Challenge Mode (T key):**  
Pressing T starts a 60-second timer challenge.  
When the time runs out, a summary screen is shown.  
The game only enters timer mode if the user chooses to press T.  
After restarting, the game returns to normal mode.

**Summary Screen with Statistics:**  
At the end of the timer challenge, a summary screen appears showing:  
- Total Attempts  
- Successful Shots  
- Accuracy (%)  
- Total Score  
- High Score (stored with localStorage)  
Includes a Restart button to start the game again.

##  Known Issues
- Hoop collision is simplified — the shot is counted if the ball enters a defined hoop area.  
- Only one basket is targeted at a time (not both hoops).

## External Assets
No external assets were used. All code and UI elements are custom-made using Three.js.

## Gameplay Preview

![Gameplay Demo](screenshots/gameplay-demo.gif)
