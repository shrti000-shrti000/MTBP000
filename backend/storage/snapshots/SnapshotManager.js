import fs from "fs";
import path from "path";


class SnapshotManager {

    constructor() {

        this.dir = path.join(
            process.cwd(),
            "storage",
            "snapshots",
            "data"
        );

        this.ensure();

    }


    ensure() {

        if (!fs.existsSync(this.dir)) {

            fs.mkdirSync(
                this.dir,
                {
                    recursive: true
                }
            );

        }

    }



    save(name, data) {

        try {

            const file =
                path.join(
                    this.dir,
                    `${name}.json`
                );


            fs.writeFileSync(
                file,
                JSON.stringify(
                    data,
                    null,
                    2
                ),
                "utf-8"
            );


            return true;

        }
        catch(error) {

            console.error(
                "SNAPSHOT SAVE ERROR",
                error.message
            );

            return false;

        }

    }



    load(name) {

        try {

            const file =
                path.join(
                    this.dir,
                    `${name}.json`
                );


            if (!fs.existsSync(file)) {

                return null;

            }


            const data =
                fs.readFileSync(
                    file,
                    "utf-8"
                );


            return JSON.parse(data);

        }
        catch(error) {

            console.error(
                "SNAPSHOT LOAD ERROR",
                error.message
            );

            return null;

        }

    }


    remove(name) {

        const file =
            path.join(
                this.dir,
                `${name}.json`
            );


        if (fs.existsSync(file)) {

            fs.unlinkSync(file);

        }

    }


}


export default new SnapshotManager();