# GoalDao – Strategic Football Passing Game

A strategic paper-football inspired passing game built with HTML5 Canvas and Vanilla JavaScript. Pass the ball between teammates, avoid interceptions, and score goals in a responsive, tactical grid-based environment. The game features dynamic player positioning, interception mechanics, and a sleek dark-mode interface.

## Live Demo
https://swarup113.github.io/GoalDao/

---

## Features
| Feature | Description |
|---------|-------------|
| Strategic Passing | Click teammates to pass or click the goal area to shoot. |
| Interception Mechanics | Opponents intercept passes if the ball trajectory crosses their path. |
| Intelligent Goalkeepers | Goalkeepers (GK) start with the ball after a goal is conceded. |
| Dynamic Positioning | 20 outfield players and 2 goalkeepers spread realistically across the field. |
| Responsive Design | Scales perfectly on desktop, tablet, and mobile devices. |
| Custom Match Duration | Choose game length from 1 to 10 minutes. |
| Pure Vanilla Stack | Built with HTML5 Canvas, CSS3, and ES6+ JavaScript—no frameworks. |
| Touch Support | Fully playable with touch gestures on mobile screens. |

## How to Play

- Start the Match – Enter team names (optional) and select a match duration. Click Start Match.
- Select Player – Click on the player who currently has the ball to select them (indicated by a glowing border).
- Pass or Shoot – Click on a teammate to pass the ball, or click inside the opponent's goal area to take a shot.
- Avoid Interceptions – Ensure your pass line does not cross any opponent, or they will intercept the ball.
- Score Goals – Blue team attacks the Bottom Goal, Red team attacks the Top Goal.
- Win – The team with the most goals when the timer hits zero wins the match.

## Rules
| Rule | Description |
|------|-------------|
| Passing | Players can only pass to their own teammates. |
| Shooting | Click inside the opponent's goal area to attempt a shot. |
| Interception | If a pass line touches or crosses an opponent, possession is turned over. |
| Possession | A successful pass retains possession; an interception switches the turn. |
| Goal Reset | After a goal, the ball is given to the goalkeeper of the team that conceded. |
| Out of Bounds | Currently, the game focuses on interception and goal mechanics within the field boundaries. |

## Game Mechanics
| Aspect | Details |
|--------|---------|
| Scoring | 1 point per goal. |
| Turn System | Possession stays with the team until a pass is intercepted or a goal is scored. |
| Field Layout | Deep green field with penalty areas and distinct goal posts at top and bottom. |
| Collision Detection | Uses vector math to calculate line intersection between ball path and opponent radius. |
| Ball Physics | Smooth easing animation for passes and shots. |

## Technologies Used
| Technology | Purpose |
|------------|---------|
| HTML5 | Structure and Canvas element for rendering. |
| CSS3 | Custom properties, gradients, animations, and responsive layout. |
| JavaScript (ES6+) | Core game loop, physics calculations, and input handling. |
| Canvas API | Drawing the field, players, ball, and dynamic pass lines. |

## License
MIT

