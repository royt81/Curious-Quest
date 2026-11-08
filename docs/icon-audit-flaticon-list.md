# Icon Audit & Flaticon Shopping List

## Fixed in code (no new icons needed)
Swapped existing mismatched racer icons for assets already in `public/themes/` that
actually match their labels:

| Theme | Racer | Was using | Now uses |
|---|---|---|---|
| Animals | Fox | p3-sloth.svg | fox.svg |
| Dino | Triceratops | p3-arasaurolophus.svg | p4-triceratops.svg |
| Dino | Pterodactyl | p4-triceratops.svg | pterodactyl.svg |
| Space | UFO | p2-rover.svg | ufo.svg |
| Space | Satellite | p3-alien (2).svg | satellite.svg |
| Sea | Dolphin | p1-octopus.svg | dolphin.svg |
| Sea | Shark | p2-stingray.svg | shark.svg |
| Sea | Seahorse | p3-marlin.svg | seahorse.svg |
| Robots | Zippy | server.svg | robot (3).svg |

## Still mismatched — buy from Flaticon
These racers still show the wrong creature/object because no matching icon
exists in the project. The current `p1-p4` racer icons share one flat,
colorful character-icon style — search Flaticon for that same pack/style
("flat character icon" packs) so new purchases blend in.

| Theme | Racer | Currently shows | Need |
|---|---|---|---|
| Animals | Rabbit | Fennec fox (p1-fennec.svg) | Rabbit/bunny icon |
| Animals | Turtle | Bee (p2-bee (1).svg) | Turtle icon |
| Animals | Frog | Gorilla (p4-gorilla.svg) | Frog icon |
| Dino | Brontosaurus | Spinosaurus (p2-spinosaurus (1).svg) | Long-neck sauropod / brontosaurus icon |
| Space | Rocket | Astronaut (p1-astronaut.svg) | Rocket icon |
| Space | Meteor | Space shuttle (p4-space-shuttle.svg) | Meteor/asteroid icon |
| Sea | Jellyfish | Anglerfish (p4-anglerfish.svg) | Jellyfish icon |

7 icons total — well within a 1-month Flaticon subscription.

## Other notes
- Robots theme has 12+ generic numbered `robot (N).svg` files; fine as-is, no purchase needed.
- Background PNGs were converted to WebP (~92% smaller) and scrim gradients normalized for
  consistent text contrast across all 5 themes.
