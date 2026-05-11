const ELEMENTS = [
  { id: "crystal-red", label: "Cristal rojo", type: "crystal", color: "red", icon: "assets/crystal-red.svg" },
  { id: "crystal-blue", label: "Cristal azul", type: "crystal", color: "blue", icon: "assets/crystal-blue.svg" },
  { id: "crystal-green", label: "Cristal verde", type: "crystal", color: "green", icon: "assets/crystal-green.svg" },
  { id: "shield", label: "Escudo", type: "shield", icon: "assets/shield.svg" },
  { id: "star", label: "Estrella", type: "star", icon: "assets/star.svg" },
  { id: "num-1", label: "Numero 1", type: "number", value: 1, icon: "assets/num-1.svg" },
  { id: "num-2", label: "Numero 2", type: "number", value: 2, icon: "assets/num-2.svg" },
  { id: "num-3", label: "Numero 3", type: "number", value: 3, icon: "assets/num-3.svg" },
  { id: "num-4", label: "Numero 4", type: "number", value: 4, icon: "assets/num-4.svg" },
  { id: "num-5", label: "Numero 5", type: "number", value: 5, icon: "assets/num-5.svg" },
  { id: "num-6", label: "Numero 6", type: "number", value: 6, icon: "assets/num-6.svg" },
  { id: "shape-circle", label: "Circulo", type: "shape", shape: "circle", icon: "assets/shape-circle.svg" },
  { id: "shape-square", label: "Cuadrado", type: "shape", shape: "square", icon: "assets/shape-square.svg" },
  { id: "shape-triangle", label: "Triangulo", type: "shape", shape: "triangle", icon: "assets/shape-triangle.svg" }
];

const WAVES = [
  {
    id: 1,
    speed: 8,
    enemies: [
      { text: "¡Necesito 2 cristales!", requirement: { type: "count", groups: [{ group: "crystal", count: 2 }] } },
      { text: "¡Busca 3 escudos!", requirement: { type: "count", groups: [{ group: "shield", count: 3 }] } },
      { text: "¡Selecciona 1 estrella!", requirement: { type: "count", groups: [{ group: "star", count: 1 }] } }
    ]
  },
  {
    id: 2,
    speed: 10,
    enemies: [
      { text: "¡Necesito 2 cristales azules!", requirement: { type: "count", items: [{ id: "crystal-blue", count: 2 }] } },
      { text: "¡2 escudos y 1 estrella!", requirement: { type: "count", items: [{ id: "shield", count: 2 }, { id: "star", count: 1 }] } },
      { text: "¡Selecciona mas escudos que cristales!", requirement: { type: "compare", left: "shield", right: "crystal", relation: ">" } },
      { text: "¡3 elementos diferentes!", requirement: { type: "unique-items", count: 3 } }
    ]
  },
  {
    id: 3,
    speed: 12,
    enemies: [
      { text: "¡Todos menos 1 cristal!", requirement: { type: "count", items: [{ id: "crystal-red", count: 1 }, { id: "crystal-blue", count: 1 }] , note: "Cristales disponibles: 3" } },
      { text: "¡El mismo numero de azules que rojos!", requirement: { type: "compare", left: "crystal-blue", right: "crystal-red", relation: "=" } },
      { text: "¡Primero 2, luego 1!", requirement: { type: "sequence", steps: [{ count: 2 }, { count: 1 }] } },
      { text: "¡Los numeros pares del 1 al 6!", requirement: { type: "count", items: [{ id: "num-2", count: 1 }, { id: "num-4", count: 1 }, { id: "num-6", count: 1 }] } },
      { text: "¡Mas de 2, menos de 5!", requirement: { type: "number-range", min: 3, max: 4, count: 1 } }
    ]
  },
  {
    id: 4,
    speed: 11,
    enemies: [
      { text: "¡INSTRUCCION MAESTRA! Selecciona: 3 rojos, 2 azules, 1 verde, 2 numeros pares, 1 forma diferente", requirement: { type: "boss", counts: { "crystal-red": 3, "crystal-blue": 2, "crystal-green": 1 }, evenNumbers: 2, shapeAny: 1 } }
    ]
  }
];
