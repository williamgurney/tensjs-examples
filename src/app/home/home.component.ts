import { Component, ViewChild, OnInit } from '@angular/core';
import { DrawableDirective } from '../drawable.directive';
import { trigger,style,transition,animate,keyframes,query,stagger } from '@angular/animations';
import { DataService } from '../data.service';

import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [

    trigger('goals', [
      transition('* => *', [

        query(':enter', style({ opacity: 0 }), {optional: true}),

        query(':enter', stagger('300ms', [
          animate('.6s ease-in', keyframes([
            style({opacity: 0, transform: 'translateY(-75%)', offset: 0}),
            style({opacity: .5, transform: 'translateY(35px)',  offset: 0.3}),
            style({opacity: 1, transform: 'translateY(0)',     offset: 1.0}),
          ]))]), {optional: true})
          ,
          query(':leave', stagger('300ms', [
          animate('.6s ease-out', keyframes([
            style({opacity: 1, transform: 'translateY(0)', offset: 0}),
            style({opacity: .5, transform: 'translateY(35px)',  offset: 0.3}),
            style({opacity: 0, transform: 'translateY(-75%)',     offset: 1.0}),
          ]))]), {optional: true})
      ])
    ])

  ]
})
export class HomeComponent implements OnInit {

  itemCount: number;
  goalText: string = '';
  btnText: string = 'Add an item';
  goals = [];
  linearModel: tf.Sequential;
  prediction: any;

  model: tf.Model;
  predictions: any;

  @ViewChild(DrawableDirective) canvas;

  constructor(private _data: DataService) { }

  ngOnInit() {
    this._data.goal.subscribe(res => this.goals = res);
    this.itemCount = this.goals.length;
    this._data.changeGoal(this.goals);
    this.trainNewModel();
    this.loadModel();
  }
  addItem() {
    this.goals.push(this.goalText);
    this.goalText = '';
    this.itemCount = this.goals.length;
    this._data.changeGoal(this.goals);
  }
  removeItem(i) {
    this.goals.splice(i, 1);
    this.itemCount = this.goals.length;
    this._data.changeGoal(this.goals);
  }

  async trainNewModel() {
      // Define a model for linear regression.
    this.linearModel = tf.sequential();
    this.linearModel.add(tf.layers.dense({units: 1, inputShape: [1]}));

    // Prepare the model for training: Specify the loss and the optimizer.
    this.linearModel.compile({loss: 'meanSquaredError', optimizer: 'sgd'});


    // Training data, completely random stuff
    const xs = tf.tensor1d([3.2, 4.4, 5.5, 6.71, 6.98, 7.168, 9.779, 6.182, 7.59, 2.16, 7.042, 10.71, 5.313, 7.97, 5.654, 9.7, 3.11]);
    const ys = tf.tensor1d([1.6, 2.7, 2.9, 3.19, 1.684, 2.53, 3.366, 2.596, 2.53, 1.22, 2.87, 3.45, 1.65, 2.904, 2.42, 2.4, 1.31]);

    // Train
    await this.linearModel.fit(xs, ys)

    console.log('model trained!')
  }

  linearPrediction(val) {
    const output = this.linearModel.predict(tf.tensor2d([val], [1, 1])) as any;
    this.prediction = Array.from(output.dataSync())[0]
  }

  //// LOAD PRETRAINED KERAS MODEL ////

  async loadModel() {
    this.model = await tf.loadModel('./assets/model.json');
  }

  async predict(imageData: ImageData) {

    const pred = await tf.tidy(() => {

      // Convert the canvas pixels to
      let img = tf.fromPixels(imageData, 1);
      img = img.reshape([1, 28, 28, 1]);
      img = tf.cast(img, 'float32');

      // Make and format the predications
      const output = this.model.predict(img) as any;

      // Save predictions on the component
      this.predictions = Array.from(output.dataSync());
    });

  }
}
