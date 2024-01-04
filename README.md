<h1 align="center">
  <br>
  UCM API
  <br>
</h1>

<h4 align="center">A Deno-based API for managing Unison Share projects via templated UCM transcripts.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-run">How to Run</a> •
  <a href="#api-endpoints">API Endpoints</a>
</p>

Disclaimer: This project is in no way affiliated with the Unison Computing company.

This API fills in the gap of how to get a string of code compiled and uploaded to Unison Share programmatically.

Currently the only officially supported method of doing so is via direct human interaction with the UCM CLI utility
which is a somewhat heavyweight executable dependant on a number of libraries to compile and upload new definitions
to a project in Unison Share. The docker container defined in the Dockerfile first downloads and extracts the executable
then sets up the credentials.json to connect to your Unison Share account.

To sidestep the need for direct human interaction or CLI puppeteering, It builds transcripts on-the-fly from templates
with the param-passed code interpolated in before running and discarding the the transcript with the results returned
in the response. All API interactions are designed to be stateless, keeping only a mirrored copy of the project locally.

There's a current limitation that you must not intervene with the project being managed by the server otherwise it will
get out of sync, but it wouldn't be terribly difficult to add support for detecting and fixing the state of being out-of-sync.

## Key Features

* **Deno Framework**: Built with Deno for modern, secure JavaScript/TypeScript server-side execution.
* **Unison Codebase Management**: Clone, compile, update, and push code to Unison codebases.
* **Middleware Integration**: Includes authentication, CORS, error handling, and response time tracking.
* **Dynamic Script Execution**: Execute scripts and manage Unison codebases with custom pipelines.
* **Template Rendering**: Utilize Eta template engine for generating dynamic scripts.
* **Stateless API Routes**: Dedicated one-shot routes for type-checking, updating and deleting.

## How to Run

First copy `.env.example` to `.env` and fill out the ENV vars listed in there accordingly to your use case.

```
CREDENTIALS_JSON - copy the contents of ~/.local/share/unisoncomputing/credentials.json here
UCM_VERSION=0.5.12 (fine to leave as-is - or whatever version you want to use although different versions may break the tooling)
MASTER_API_KEY - enter a random string of whatever length you're comfortable with to serve as the Bearer API key for the server
PROJECT=@username/projectname - fill this out with the name of the project, it should be under the same account as CREDENTIALS_JSON
```

Ensure you have Docker installed and then run:

```bash
./script/run_docker.sh
```

and that should handle building and running the server on the default port (8000). You can interact with the
API via http://localhost:8000/. You may need to reference the contents of the script and adjust depending on your docker setup.

The API was designed to run on Back4App for free, but it will likely work on any container-as-a-service like digital ocean, etc.

##  API Endpoints
```
/version: Get the current version of the Unison Codebase Manager.
/compile: Compile temporary code against the generic base library to check for type errors.
/delete: Delete type or term definitions from the project and push changes.
/push: Update and push new terms and/or types to the project and push changes.
```
## Contributing

Contributions are welcome, although be aware it's a new project under active development. Contact me at me@jcwilk.com if you're
interested in collaboration.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
