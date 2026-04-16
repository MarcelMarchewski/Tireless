import 
{
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import
{
    SplashScreen
} from "/source/tireless/splashScreen.js";

const _playButton = document.getElementById("playButton");

const _baseWidth = 256;
const _baseHeight = 256;

_playButton.onclick = () =>
{
    const _startScene = new SplashScreen();

    const _scale = Math.floor(Math.min(window.innerWidth / _baseWidth, window.innerHeight / _baseHeight));

    new Engine(256, 256, new Vector2(_scale, _scale), false, "10px solid white");

    Engine.I.LoadScene(_startScene);

    _playButton.remove();
}