# MathLab: Interactive Mathematical Computing Lab

An interactive browser-based project that shows how mathematical concepts are used in computer applications. Built with plain HTML, CSS and JavaScript. No installation needed.

**Subject:** Mathematical Foundation of Computer Application
**Team:** Shubh, Aditya, Faraz

## Features

- **Function Explorer:** type a function like `x^2 - 4` and see its graph.
- **Derivative and Rate of Change:** estimates the slope at a point using the central difference formula, with a table showing how the estimate improves as h gets smaller.
- **Set Operations:** union, intersection and difference of two sets, like filtering records in a database.
- **Gradient Descent Lab:** a ball rolls down a curve step by step to find the minimum, the same idea AI models use to reduce their error. (delete this line if the section is not added)

## Maths concepts used

| Concept | Where it appears |
|---|---|
| Functions | Graph plotter, input and output mapping |
| Limits | Slope table: the estimate gets closer to the exact derivative as h approaches 0 |
| Differentiation | f'(a) is approximately [f(a+h) - f(a-h)] / 2h |
| Set theory | Union, intersection and difference |
| Gradient descent | new x = old x - (learning rate x slope) |

## How to run

1. Download `index.html`, or open the live link on GitHub Pages.
2. Open it in Chrome, Edge or Firefox.

## Where this is used in computing

- Plotting and visualization tools
- Training machine learning models (gradient descent)
- Database queries (set operations)

## What we learned

- Mathematical rules can be turned into algorithms using JavaScript.
- A smaller h gives a more accurate slope, but extremely small values cause rounding errors.
- The learning rate matters: too large and gradient descent overshoots or diverges.

## Tech stack

HTML, CSS, JavaScript (Canvas API)
