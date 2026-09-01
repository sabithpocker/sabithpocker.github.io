// Möbius Strip - the site's first topology/3D experiment (plan.md MM-017).
// Self-contained, following this site's established per-component pattern
// (own shadow DOM, own render loop) rather than the plan's full
// ExperimentDefinition/registry architecture - there's only one topology
// experiment so far, so there's nothing repeated yet to abstract (see
// plan.md Rule 3). Three.js is used for the 3D pipeline itself (mesh,
// camera, lighting, OrbitControls) rather than hand-rolling one, per
// plan.md section 28 - loaded straight from a CDN as an ES module, the same
// way this project already loads gl-matrix from a CDN for mm-alhambra.js
// (and "three" is already a pinned package.json dependency, just never
// wired up to an actual page yet).
// Resolved via the import map declared in mobius.html - OrbitControls
// itself imports "three" as a bare specifier internally, so both this file
// and mobius.html need to agree on where "three" points.
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.138.3/examples/jsm/controls/OrbitControls.js';

// Parametric Möbius surface, u in [0,2*PI), v in [-width/2, width/2]:
//   x = (R + v*cos(twist*u/2)) * cos(u)
//   y = (R + v*cos(twist*u/2)) * sin(u)
//   z = v * sin(twist*u/2)
// twist must be an integer for the surface to close consistently at
// u=0/u=2*PI - odd values give the classic one-sided non-orientable band,
// even values give an orientable (two-sided) twisted band instead.
function mobiusPosition(u, v, width, twist, radius, target) {
    const angle = u * Math.PI * 2;
    const vv = (v - 0.5) * width;
    const half = twist * angle / 2;
    const r = radius + vv * Math.cos(half);
    target.set(
        r * Math.cos(angle),
        r * Math.sin(angle),
        vv * Math.sin(half)
    );
}

class MMMobiusStrip extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.canvas = document.createElement('canvas');
        this.shadowRoot.innerHTML = `<style>
            :host { display: block; width: 100%; height: 100%; }
            canvas { width: 100%; height: 100%; display: block; }
        </style>`;
        this.shadowRoot.appendChild(this.canvas);

        this.twist = 1;
        this.width = 1.0;
        this.segments = 160;
        this.materialMode = 'normal';
        this.color = '#7cc6ff';
        this.autoRotate = true;
        this.rotateSpeed = 0.6;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        this.camera.position.set(0, -3.2, 2.4);
        this.camera.up.set(0, 0, 1);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;

        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        const key = new THREE.DirectionalLight(0xffffff, 0.9);
        key.position.set(3, -2, 4);
        const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
        fill.position.set(-3, 2, -2);
        this.scene.add(ambient, key, fill);

        this.mesh = null;
        this.rebuildGeometry();
        this.rebuildMaterial();

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this._loop();
    }

    // Rebuilds the mesh geometry from twist/width/segments - needed any time
    // one of those changes since a parametric surface can't be "patched" in
    // place. Cheap enough (a modest u/v grid) to do on every slider input.
    rebuildGeometry() {
        const uSegments = Math.max(3, Math.round(this.segments));
        const vSegments = Math.max(1, Math.round(this.segments / 8));
        const positions = [];
        const normals = [];
        const indices = [];
        const width = this.width, twist = this.twist, radius = 1;
        const tmp = new THREE.Vector3();
        const eps = 1e-4;
        const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();

        for (let i = 0; i <= uSegments; i++) {
            const u = i / uSegments;
            for (let j = 0; j <= vSegments; j++) {
                const v = j / vSegments;
                mobiusPosition(u, v, width, twist, radius, tmp);
                positions.push(tmp.x, tmp.y, tmp.z);

                // Approximate normal via finite differences of the surface.
                mobiusPosition(u + eps, v, width, twist, radius, a);
                mobiusPosition(u, v + eps, width, twist, radius, b);
                c.set(tmp.x, tmp.y, tmp.z);
                a.sub(c); b.sub(c);
                n.crossVectors(a, b).normalize();
                normals.push(n.x, n.y, n.z);
            }
        }
        const stride = vSegments + 1;
        for (let i = 0; i < uSegments; i++) {
            for (let j = 0; j < vSegments; j++) {
                const a0 = i * stride + j;
                const b0 = (i + 1) * stride + j;
                indices.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setIndex(indices);

        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = geometry;
        } else {
            this.mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
            this.scene.add(this.mesh);
        }
    }

    rebuildMaterial() {
        if (!this.mesh) return;
        const old = this.mesh.material;
        if (this.materialMode === 'wireframe') {
            this.mesh.material = new THREE.MeshBasicMaterial({ color: this.color, wireframe: true });
        } else if (this.materialMode === 'solid') {
            this.mesh.material = new THREE.MeshStandardMaterial({ color: this.color, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.1 });
        } else {
            this.mesh.material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
        }
        if (old) old.dispose();
    }

    resetView() {
        this.camera.position.set(0, -3.2, 2.4);
        this.camera.up.set(0, 0, 1);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    resize() {
        const w = this.clientWidth || 1;
        const h = this.clientHeight || 1;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h, false);
    }

    _loop() {
        const tick = () => {
            if (this.autoRotate) {
                this.mesh.rotation.z += 0.003 * this.rotateSpeed;
            }
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
}

customElements.define('mm-mobiusstrip', MMMobiusStrip);
