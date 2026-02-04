import 
{
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import
{
    MainMenu
} from "/source/tireless/mainMenu.js";

const _playButton = document.getElementById("playButton");

_playButton.onclick = () =>
{
    const _startScene = new MainMenu();

    const _scale = 4096 / document.body.clientWidth;

    new Engine(256, 240, new Vector2(4, 4), false, "10px solid white");

    Engine.I.LoadScene(_startScene);

    _playButton.remove();
}