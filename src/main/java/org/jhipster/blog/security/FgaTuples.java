package org.jhipster.blog.security;

import dev.openfga.OpenFgaExceptionHandler;
import dev.openfga.sdk.api.client.OpenFgaClient;
import dev.openfga.sdk.api.client.model.ClientListObjectsRequest;
import dev.openfga.sdk.api.client.model.ClientReadRequest;
import dev.openfga.sdk.api.client.model.ClientTupleKey;
import dev.openfga.sdk.api.client.model.ClientTupleKeyWithoutCondition;
import dev.openfga.sdk.api.client.model.ClientWriteRequest;
import dev.openfga.sdk.api.configuration.ClientReadOptions;
import dev.openfga.sdk.api.model.ReadResponse;
import dev.openfga.sdk.api.model.Tuple;
import dev.openfga.sdk.api.model.TupleKey;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Reads, writes, and deletes the relationship tuples that OpenFGA uses to decide who can access blogs and posts.
 */
@Component
public class FgaTuples {

    private final OpenFgaClient fgaClient;
    private final OpenFgaExceptionHandler exceptionHandler;

    public FgaTuples(OpenFgaClient fgaClient, OpenFgaExceptionHandler exceptionHandler) {
        this.fgaClient = fgaClient;
        this.exceptionHandler = exceptionHandler;
    }

    public void write(String user, String relation, String object) {
        try {
            fgaClient.writeTuples(List.of(new ClientTupleKey().user(user).relation(relation)._object(object))).get();
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error writing tuple %s %s %s", user, relation, object);
        }
    }

    public void delete(String user, String relation, String object) {
        try {
            fgaClient.deleteTuples(List.of(new ClientTupleKeyWithoutCondition().user(user).relation(relation)._object(object))).get();
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error deleting tuple %s %s %s", user, relation, object);
        }
    }

    /**
     * Replaces {@code oldUser} with {@code newUser} in one request, so OpenFGA makes both changes or neither.
     */
    public void replace(String oldUser, String newUser, String relation, String object) {
        try {
            fgaClient
                .write(
                    new ClientWriteRequest()
                        .writes(List.of(new ClientTupleKey().user(newUser).relation(relation)._object(object)))
                        .deletes(List.of(new ClientTupleKeyWithoutCondition().user(oldUser).relation(relation)._object(object)))
                )
                .get();
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error replacing %s with %s in tuple %s %s", oldUser, newUser, relation, object);
        }
    }

    /**
     * Deletes all the tuples stored for {@code object} in one request, so OpenFGA deletes all of them or none.
     */
    public void deleteAll(String object) {
        List<ClientTupleKeyWithoutCondition> deletes = read(object, null)
            .stream()
            .map(tuple -> new ClientTupleKeyWithoutCondition().user(tuple.getUser()).relation(tuple.getRelation())._object(tuple.getObject()))
            .toList();
        if (deletes.isEmpty()) {
            return;
        }
        try {
            fgaClient.write(new ClientWriteRequest().deletes(deletes)).get();
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error deleting tuples for %s", object);
        }
    }

    /**
     * Returns the ids of all objects of {@code type} that {@code user} has {@code relation} to, e.g. the blogs a user can view.
     */
    public List<Long> listObjectIds(String user, String relation, String type) {
        try {
            return fgaClient
                .listObjects(new ClientListObjectsRequest().user(user).relation(relation).type(type))
                .get()
                .getObjects()
                .stream()
                .map(object -> Long.valueOf(object.substring(type.length() + 1)))
                .toList();
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error listing %s objects for %s", type, user);
        }
    }

    /**
     * Returns the tuples stored for {@code object}, optionally limited to one {@code relation}. Reads every page, so none are missed.
     */
    public List<TupleKey> read(String object, String relation) {
        try {
            List<TupleKey> tuples = new ArrayList<>();
            String continuationToken = null;
            do {
                ReadResponse page = fgaClient
                    .read(new ClientReadRequest()._object(object).relation(relation), new ClientReadOptions().continuationToken(continuationToken))
                    .get();
                page.getTuples().stream().map(Tuple::getKey).forEach(tuples::add);
                continuationToken = page.getContinuationToken();
            } while (continuationToken != null && !continuationToken.isEmpty());
            return tuples;
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error reading tuples for %s", object);
        }
    }
}
