/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
const IMAGE_SIZE=784,NUM_CLASSES=10,NUM_DATASET_ELEMENTS=65e3,NUM_TRAIN_ELEMENTS=55e3,NUM_TEST_ELEMENTS=1e4,MNIST_IMAGES_SPRITE_PATH="https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png",MNIST_LABELS_PATH="https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8";export class MnistData{constructor(){this.shuffledTrainIndex=0,this.shuffledTestIndex=0}async load(){const t=new Image,e=document.createElement("canvas"),s=e.getContext("2d"),a=new Promise(((a,i)=>{t.crossOrigin="",t.onload=()=>{t.width=t.naturalWidth,t.height=t.naturalHeight;const i=new ArrayBuffer(20384e4),n=5e3;e.width=t.width,e.height=n;for(let a=0;a<13;a++){const h=new Float32Array(i,784*a*n*4,392e4);s.drawImage(t,0,a*n,t.width,n,0,0,t.width,n);const r=s.getImageData(0,0,e.width,e.height);for(let t=0;t<r.data.length/4;t++)h[t]=r.data[4*t]/255}this.datasetImages=new Float32Array(i),a()},t.src=MNIST_IMAGES_SPRITE_PATH})),i=fetch(MNIST_LABELS_PATH),[n,h]=await Promise.all([a,i]);this.datasetLabels=new Uint8Array(await h.arrayBuffer()),this.trainIndices=tf.util.createShuffledIndices(55e3),this.testIndices=tf.util.createShuffledIndices(1e4),this.trainImages=this.datasetImages.slice(0,4312e4),this.testImages=this.datasetImages.slice(4312e4),this.trainLabels=this.datasetLabels.slice(0,55e4),this.testLabels=this.datasetLabels.slice(55e4)}nextTrainBatch(t){return this.nextBatch(t,[this.trainImages,this.trainLabels],(()=>(this.shuffledTrainIndex=(this.shuffledTrainIndex+1)%this.trainIndices.length,this.trainIndices[this.shuffledTrainIndex])))}nextTestBatch(t){return this.nextBatch(t,[this.testImages,this.testLabels],(()=>(this.shuffledTestIndex=(this.shuffledTestIndex+1)%this.testIndices.length,this.testIndices[this.shuffledTestIndex])))}nextBatch(t,e,s){const a=new Float32Array(784*t),i=new Uint8Array(10*t);for(let n=0;n<t;n++){const t=s(),h=e[0].slice(784*t,784*t+784);a.set(h,784*n);const r=e[1].slice(10*t,10*t+10);i.set(r,10*n)}return{xs:tf.tensor2d(a,[t,784]),labels:tf.tensor2d(i,[t,10])}}}