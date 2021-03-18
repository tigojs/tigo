# tigo

`tigo` is a All-in-one lightweight cloud service platform that you can easily deploy it to your own server.

## What's our goal?

Our goal is implement some core functions which be used most often in the common cloud service platform in a lightweight and simple way, then we use them to build a lightweight cloud service platform that can be deployed privately.

In order to bring more possibilities to this project, the basic framework will only contain some necessary core functions to give it strong scalability.

If you're not interested in our goal, you can also try to use the framework to build something you like.

## Description

The official packages are divided into 4 parts: framework, functional packages, lambda packages and tools.

The main package `tigo` is a basic web service framework based on koa, you can use it with `@tigojs/utils` to develope your own functional packages to build your server, also you can use the official packages. More details are in the full documentation.

Functional packages are pluggable service extensions which can be mounted to the framework as plugins, the official packages in the `packages` folder are aimed to build a all-in-one lightweight cloud service platform, if that's not what you want, you can build your own services with your functional packages to achieve your goal, that's welcome.

Lambda packages in the `lambda-packags` folder is just some packages for `@tigojs/faas`, if you're not interested with it, you can totally ignore this part.

The last part, tools, which in the `tools` folder, are some helper for the official functional packages, like a tool that make API access easier, etc. You can ignore this part as well if you're not interested with what we want to achieve.

## License

MIT
