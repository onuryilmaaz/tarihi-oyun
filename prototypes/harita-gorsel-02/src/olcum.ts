// Kare süresi ölçümü. Not: rAF aralığı ekran yenileme hızıyla sınırlıdır (60/120 Hz);
// "render CPU" yalnızca renderer.render çağrısının JS tarafındaki süresidir, GPU süresi değildir.

export interface KareOzeti {
  kareSayisi: number;
  ortFps: number;
  kareMsP50: number;
  kareMsP95: number;
  kareMsP99: number;
  kareMsMaks: number;
  renderCpuMsOrt: number;
  renderCpuMsP95: number;
}

function yuzdelik(sirali: Float64Array, p: number): number {
  if (!sirali.length) return 0;
  return sirali[Math.min(sirali.length - 1, Math.floor(p * sirali.length))];
}

export class KareOlcer {
  private dt: Float64Array;
  private cpu: Float64Array;
  private i = 0;
  private n = 0;

  constructor(kapasite: number) {
    this.dt = new Float64Array(kapasite);
    this.cpu = new Float64Array(kapasite);
  }

  ekle(dtMs: number, cpuMs: number) {
    this.dt[this.i] = dtMs;
    this.cpu[this.i] = cpuMs;
    this.i = (this.i + 1) % this.dt.length;
    this.n = Math.min(this.n + 1, this.dt.length);
  }

  sifirla() {
    this.i = 0;
    this.n = 0;
  }

  ozet(): KareOzeti {
    const dt = this.dt.slice(0, this.n).sort();
    const cpu = this.cpu.slice(0, this.n).sort();
    let toplamDt = 0, toplamCpu = 0;
    for (let k = 0; k < this.n; k++) {
      toplamDt += dt[k];
      toplamCpu += cpu[k];
    }
    const yuvarla = (x: number) => Math.round(x * 100) / 100;
    return {
      kareSayisi: this.n,
      ortFps: yuvarla(this.n ? 1000 / (toplamDt / this.n) : 0),
      kareMsP50: yuvarla(yuzdelik(dt, 0.5)),
      kareMsP95: yuvarla(yuzdelik(dt, 0.95)),
      kareMsP99: yuvarla(yuzdelik(dt, 0.99)),
      kareMsMaks: yuvarla(this.n ? dt[this.n - 1] : 0),
      renderCpuMsOrt: yuvarla(this.n ? toplamCpu / this.n : 0),
      renderCpuMsP95: yuvarla(yuzdelik(cpu, 0.95)),
    };
  }
}

export function gpuAdi(gl: WebGLRenderingContext | WebGL2RenderingContext): string {
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
}

export function heapMb(): number | null {
  const m = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return m ? Math.round(m.usedJSHeapSize / 1048576) : null;
}
