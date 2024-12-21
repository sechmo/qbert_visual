# Arcade Video Game - Q*Bert

A p5 based recreation of the classic arcade game Q*bert for the Visual Computing - 2024-2 class at Universidad Nacional de Colombia.

## Team

- David Alfonso Cañas Palomino - Saturday Group
- Juan Sebastian Sarmiento Pulido - Saturday Group
- Esteban Lopez Barreto - Saturday Group
- Sergio Sanchez Moreno - Virtual Group

# Program Structure

Some notes relevant to the implementation and program structure
- The game is drawn over a graphics buffer at the real pixel scale, then we rescale this buffer without loosing resolution.
- We use 3D coordinates for the game, then we apply an isometric projection to properly render everything in the 2D screen.
- A big chunk of the code corresponds to animations for the entities movement, we mainly use ease out and ease it for parabolic movements. 
- Almost everything on screen is rendered using sprites from the sprite sheet.
- Everything related to the core game logic is in the `QbertGame` class in `sketch.js`, there is some rendering logic there too, the classes for each entity manage some little "state machines" and animations.

# References
  
  - We use the sprite sheet submitted by user  	*Superjustinbros* at  https://www.spriters-resource.com/arcade/qbert/sheet/60496/ 