import { Composition, Still } from "remotion";
import { ShadowBidFilm } from "./Composition";
import { Thumbnail } from "./scenes";
export const RemotionRoot = () => (
  <>
    <Composition
      id="ShadowBidDemo"
      component={ShadowBidFilm}
      durationInFrames={3510}
      fps={30}
      width={1920}
      height={1080}
    />
    <Still id="Thumbnail" component={Thumbnail} width={1920} height={1080} />
  </>
);
