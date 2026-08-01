package com.quickbite.food_delivery_backend.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    /**
     * With spring.jpa.open-in-view=false the persistence session is closed before the response
     * is written, so any lazy association Jackson touches would throw a
     * LazyInitializationException. This module writes uninitialised associations as null
     * instead.
     *
     * <p>FORCE_LAZY_LOADING stays off on purpose: loading collections during serialisation is
     * exactly the N+1 behaviour open-in-view=false exists to prevent. Anything an endpoint
     * genuinely needs is fetched up front with an @EntityGraph on the repository method.
     */
    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, false);
        return module;
    }
}
