import { defineComponent } from 'vue';

export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <container loc={[60, 50, 360, 220]}>
                <g-rect
                    loc={[0, 0, 360, 220]}
                    fillStyle="#2f6fed"
                    alpha={0.22}
                />
                <g-circle circle={[0, 0, 6]} fillStyle="#e8f0ff" />
                <text loc={[16, 16]} text="父容器原点" fillStyle="#cfe0ff" />

                <container loc={[80, 60, 200, 120]}>
                    <g-rect
                        loc={[0, 0, 200, 120]}
                        fillStyle="#f2b84b"
                        alpha={0.3}
                    />
                    <g-circle circle={[0, 0, 6]} fillStyle="#ffe9b0" />
                    <text
                        loc={[16, 16]}
                        text="子容器原点"
                        fillStyle="#ffe9b0"
                    />
                </container>
            </container>
        </container>
    );
});
