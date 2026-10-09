class BaseRepository {

    constructor(storage, collection) {
        this.storage = storage;
        this.collection = collection;
    }


    async save(id, data) {
        return this.storage.set(
            this.collection,
            id,
            data
        );
    }


    async find(id) {
        return this.storage.get(
            this.collection,
            id
        );
    }


    async findAll() {
        return this.storage.getAll(
            this.collection
        );
    }


    async remove(id) {
        return this.storage.delete(
            this.collection,
            id
        );
    }

}

export default BaseRepository;