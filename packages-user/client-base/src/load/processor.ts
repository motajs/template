import { IMotaAudioContext } from '@motajs/audio';
import { ILoadTask, ILoadTaskProcessor, LoadDataType } from '@motajs/loader';
import JSZip from 'jszip';

export class LoadImageProcessor implements ILoadTaskProcessor<
    LoadDataType.Blob,
    ImageBitmap
> {
    process(response: Blob): Promise<ImageBitmap> {
        return createImageBitmap(response);
    }
}

export class LoadAudioProcessor implements ILoadTaskProcessor<
    LoadDataType.Uint8Array,
    AudioBuffer | null
> {
    constructor(private readonly ac: IMotaAudioContext) {}

    process(response: Uint8Array<ArrayBuffer>): Promise<AudioBuffer | null> {
        return this.ac.decodeToAudioBuffer(response);
    }
}

export class LoadFontProcessor implements ILoadTaskProcessor<
    LoadDataType.ArrayBuffer,
    FontFace
> {
    process(
        response: ArrayBuffer,
        task: ILoadTask<LoadDataType.ArrayBuffer, FontFace>
    ): Promise<FontFace> {
        const font = new FontFace(task.identifier, response);
        if (font.status === 'loaded') return Promise.resolve(font);
        else return font.load();
    }
}

export class LoadZipProcessor implements ILoadTaskProcessor<
    LoadDataType.ArrayBuffer,
    JSZip
> {
    async process(response: ArrayBuffer): Promise<JSZip> {
        const zip = new JSZip();
        await zip.loadAsync(response);
        return zip;
    }
}

export class LoadTextProcessor implements ILoadTaskProcessor<
    LoadDataType.Text,
    string
> {
    process(response: string): Promise<string> {
        return Promise.resolve(response);
    }
}

export class LoadJSONProcessor<T> implements ILoadTaskProcessor<
    LoadDataType.JSON,
    T
> {
    process(response: any): Promise<T> {
        return Promise.resolve(response);
    }
}
