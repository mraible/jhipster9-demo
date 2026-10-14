package org.jhipster.blog.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.openfga.OpenFGAContainer;

@TestConfiguration(proxyBeanMethods = false)
public class OpenFgaTestContainer {

    @Bean
    @ServiceConnection
    public OpenFGAContainer openFgaContainer() {
        return new OpenFGAContainer("openfga/openfga:v1.22.0");
    }
}
