import { onUnmounted } from 'vue';
import { WeatherController } from '../weather';
import { IRenderTreeRoot } from '@motajs/render';

export function useWeather(renderer: IRenderTreeRoot): [WeatherController] {
    const weather = new WeatherController(renderer);

    onUnmounted(() => {
        weather.destroy();
    });

    return [weather];
}
