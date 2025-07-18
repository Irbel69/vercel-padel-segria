# Top Players Section

Esta sección muestra los 3 mejores jugadores de Padel Segrià con sus estadísticas y cualidades destacadas.

## Características

- **Diseño Responsivo**: Se adapta perfectamente a dispositivos móviles y desktop
- **Efectos Hover**: Animaciones modernas al pasar el cursor sobre las tarjetas
- **Cualidades Aleatorias**: Cada jugador muestra 3 cualidades aleatorias de una lista predefinida
- **Iconos Dinámicos**: Cada cualidad tiene su propio icono representativo
- **Panel Flotante**: Área adicional con información y llamadas a la acción
- **Colores del Proyecto**: Usa los colores principales del diseño (#e5f000 y #051c2c)

## Cualidades Disponibles

Las cualidades se asignan aleatoriamente de la siguiente lista:

- Lideratge, Anticipació, Potència, Velocitat, Resistència
- Reflexos, Flexibilitat, Equilibri, Mobilitat, Defensa
- Atac, Control, Col·locació, Volea, Globo
- Rematada, Vibora, Servei, Sortida, Contraatac
- Baixada de pared, Bandeja, Comunicació, Adaptació, X3

## Componentes Utilizados

- `Card` y `CardContent` de shadcn para las tarjetas
- `Avatar`, `AvatarImage`, `AvatarFallback` para las imágenes de jugadores
- `Button` para botones de llamada a la acción
- `Badge` para etiquetas (como "Campió")
- Iconos de `lucide-react` para las cualidades y decoración

## Uso

```tsx
import { TopPlayersSection } from "@/components/sections";

export default function Page() {
	return (
		<main>
			<TopPlayersSection />
		</main>
	);
}
```

## Notas sobre las Imágenes

Las imágenes de avatares están configuradas para cargar desde `/avatars/[nombre].png`.
Si no se encuentra la imagen, se mostrará un fallback con las iniciales del jugador.

Para añadir imágenes reales, coloca los archivos en `public/avatars/`:

- joan.png
- maria.png
- carlos.png
